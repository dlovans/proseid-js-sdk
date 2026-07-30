import { ProseIDError } from './errors.js';
import { parseFlowCoordinate } from './api.js';
import { normalizeColors } from './themes.js';
import { frameChannel, frameMessage, isFrameMessage } from './frameProtocol.js';

const KEY_RE = /^proseid_pk_[a-f0-9]{32,64}$/;
const CALLBACK_NAMES = new Set(['ready', 'change', 'validation', 'submit', 'signing', 'complete', 'receipt', 'language', 'error']);

function targetElement(target) {
	const element = typeof target === 'string' ? document.querySelector(target) : target;
	if (!(element instanceof Element)) throw new ProseIDError('invalid_target', 'Choose an element to contain the ProseID Flow.');
	return element;
}

function frameBase(value) {
	try {
		const url = new URL(value || 'https://proseid.com');
		if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
			throw new Error('unsafe');
		}
		return url.origin;
	} catch {
		throw new ProseIDError('invalid_api_base', 'Use a valid HTTPS ProseID address.');
	}
}

function serializableOptions(options) {
	return {
		theme: options.theme,
		colors: normalizeColors(options.colors),
		appearance: options.appearance,
		branding: options.branding ? {
			logoUrl: options.branding.logoUrl,
			logoAlt: options.branding.logoAlt,
			proseid: options.branding.proseid
		} : undefined,
		validateDelay: options.validateDelay,
		locale: options.locale,
		messages: options.messages,
		submitLabel: options.submitLabel
	};
}

function errorFromDetail(detail) {
	const error = new ProseIDError(
		detail?.code || 'embed_error',
		detail?.message || 'The embedded Flow could not be completed.',
		detail?.status || 0,
		detail?.details || {}
	);
	return error;
}

/** Browser-side controller for the ProseID-hosted, cross-origin Flow frame. */
export class ProseIDFrame {
	constructor(target, options = {}) {
		this.target = targetElement(target);
		if (!options.flow && !options.testMode) throw new ProseIDError('invalid_flow', 'The Flow coordinate is required.');
		if (!KEY_RE.test(String(options.apiKey || ''))) throw new ProseIDError('invalid_api_key', 'A ProseID publishable key is required.');
		this.options = options;
		this.valid = false;
		this.manifest = null;
		this.destroyed = false;
		this.channel = frameChannel();
		this.frameOrigin = frameBase(options.apiBase);
		this.pending = new Map();
		this.requestSequence = 0;
		this.onMessage = this.onMessage.bind(this);

		const coordinate = options.testMode ? null : parseFlowCoordinate(options.flow);
		const path = options.testMode
			? '/embed/v1/test'
			: `/embed/v1/flows/${encodeURIComponent(coordinate.publisher)}/${encodeURIComponent(coordinate.slug)}`;
		this.frame = document.createElement('iframe');
		this.frame.dataset.proseidFrame = '';
		this.frame.title = options.title || 'ProseID compliance Flow';
		this.frame.src = `${this.frameOrigin}${path}#channel=${encodeURIComponent(this.channel)}`;
		this.frame.loading = options.loading === 'lazy' ? 'lazy' : 'eager';
		this.frame.referrerPolicy = 'origin';
		this.frame.setAttribute('sandbox', 'allow-forms allow-popups allow-same-origin allow-scripts');
		this.frame.setAttribute('scrolling', 'no');
		this.frame.style.cssText = 'display:block;width:100%;height:220px;border:0;background:transparent;overflow:hidden;color-scheme:normal;';
		window.addEventListener('message', this.onMessage);
		this.target.replaceChildren(this.frame);
		this.ready = new Promise((resolve, reject) => {
			this.resolveReady = resolve;
			this.rejectReady = reject;
		});
	}

	post(type, payload = {}) {
		if (this.destroyed || !this.frame.contentWindow) return;
		this.frame.contentWindow.postMessage(frameMessage(this.channel, type, payload), this.frameOrigin);
	}

	onMessage(event) {
		if (this.destroyed || event.origin !== this.frameOrigin || event.source !== this.frame.contentWindow || !isFrameMessage(event.data, this.channel)) return;
		const message = event.data;
		if (message.type === 'frame-ready') {
			this.post('initialize', {
				apiKey: this.options.apiKey,
				options: serializableOptions(this.options)
			});
			return;
		}
		if (message.type === 'resize') {
			const height = Math.max(180, Math.min(100_000, Math.ceil(Number(message.height) || 0)));
			this.frame.style.height = `${height}px`;
			return;
		}
		if (message.type === 'response') {
			const pending = this.pending.get(message.requestId);
			if (!pending) return;
			this.pending.delete(message.requestId);
			if (message.ok) pending.resolve(message.result);
			else pending.reject(errorFromDetail(message.error));
			return;
		}
		if (message.type === 'signing-request') {
			this.handleSigning(message);
			return;
		}
		if (message.type !== 'event' || !CALLBACK_NAMES.has(message.name)) return;
		const detail = message.name === 'error' ? { error: errorFromDetail(message.detail) } : message.detail;
		if (message.name === 'ready') {
			this.manifest = detail?.manifest || null;
			this.resolveReady?.(this);
			this.resolveReady = null;
			this.rejectReady = null;
		}
		if (message.name === 'validation') this.valid = detail?.valid === true;
		if (message.name === 'error' && this.rejectReady) {
			this.rejectReady(detail.error);
			this.resolveReady = null;
			this.rejectReady = null;
		}
		this.target.dispatchEvent(new CustomEvent(`proseid:${message.name}`, { detail, bubbles: true, composed: true }));
		const callback = this.options[`on${message.name[0].toUpperCase()}${message.name.slice(1)}`];
		if (typeof callback === 'function') callback(message.name === 'error' ? detail.error : detail);
	}

	async handleSigning(message) {
		try {
			if (!this.options.signingAdapter?.sign) throw new ProseIDError('signing_not_configured', 'No signing adapter was configured.');
			const result = await this.options.signingAdapter.sign(message.nextAction, message.context);
			this.post('signing-response', { requestId: message.requestId, ok: true, result });
		} catch (error) {
			this.post('signing-response', {
				requestId: message.requestId,
				ok: false,
				error: { code: error?.code || 'signing_failed', message: error?.message || 'Signing failed.' }
			});
		}
	}

	request(command) {
		if (this.destroyed) return Promise.reject(new ProseIDError('embed_destroyed', 'This embedded Flow was removed.'));
		const requestId = `${this.channel}_${++this.requestSequence}`;
		return new Promise((resolve, reject) => {
			this.pending.set(requestId, { resolve, reject });
			this.post('command', { requestId, command });
		});
	}

	validate() {
		return this.request('validate');
	}

	destroy() {
		if (this.destroyed) return;
		this.destroyed = true;
		window.removeEventListener('message', this.onMessage);
		for (const pending of this.pending.values()) pending.reject(new ProseIDError('embed_destroyed', 'This embedded Flow was removed.'));
		this.pending.clear();
		this.frame.remove();
	}
}
