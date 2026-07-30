import { ProseIDForm as RuntimeForm } from './ProseIDForm.js';
import { frameMessage, isFrameMessage } from './frameProtocol.js';

const root = document.querySelector('#proseid-frame-root');
const channel = new URLSearchParams(location.hash.slice(1)).get('channel') || '';
const parentWindow = window.parent;
let parentOrigin = null;
let form = null;
let initialized = false;
let signingSequence = 0;
const signingRequests = new Map();

function post(type, payload = {}) {
	if (!channel || !parentOrigin) return;
	parentWindow.postMessage(frameMessage(channel, type, payload), parentOrigin);
}

function serializedError(error) {
	return {
		code: error?.code || 'embed_error',
		message: error?.message || 'The embedded Flow could not be completed.',
		status: Number(error?.status) || 0,
		details: error?.details && typeof error.details === 'object' ? error.details : {}
	};
}

function coordinateFromPath() {
	const parts = location.pathname.split('/').filter(Boolean);
	if (parts.join('/') === 'embed/v1/test') return { testMode: true };
	if (parts.length === 5 && parts[0] === 'embed' && parts[1] === 'v1' && parts[2] === 'flows') {
		return { flow: `${decodeURIComponent(parts[3])}/${decodeURIComponent(parts[4])}`, testMode: false };
	}
	return null;
}

function signingAdapter() {
	return {
		sign(nextAction, context) {
			const requestId = `sign_${++signingSequence}`;
			return new Promise((resolve, reject) => {
				signingRequests.set(requestId, { resolve, reject });
				post('signing-request', { requestId, nextAction, context });
			});
		}
	};
}

function forward(name) {
	root.addEventListener(`proseid:${name}`, (event) => {
		const detail = name === 'error' ? serializedError(event.detail?.error) : event.detail;
		post('event', { name, detail });
	});
}

for (const name of ['ready', 'change', 'validation', 'submit', 'signing', 'complete', 'receipt', 'language', 'error']) forward(name);

const observer = new ResizeObserver(() => {
	post('resize', { height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) });
});
observer.observe(document.documentElement);

window.addEventListener('message', async (event) => {
	if (event.source !== parentWindow || !isFrameMessage(event.data, channel)) return;
	const message = event.data;
	if (message.type === 'initialize' && !initialized) {
		initialized = true;
		parentOrigin = event.origin;
		const coordinate = coordinateFromPath();
		if (!coordinate) {
			post('event', { name: 'error', detail: { code: 'invalid_flow', message: 'The embedded Flow address is invalid.' } });
			return;
		}
		try {
			form = new RuntimeForm(root, {
				...(message.options || {}),
				...coordinate,
				apiKey: message.apiKey,
				apiBase: location.origin,
				parentOrigin,
				signingAdapter: signingAdapter()
			});
			await form.ready;
		} catch {
			// RuntimeForm emits the descriptive error event before rejecting ready.
		}
		return;
	}
	if (!initialized || event.origin !== parentOrigin) return;
	if (message.type === 'command') {
		try {
			if (message.command !== 'validate' || !form) throw new Error('Unsupported embed command.');
			const result = await form.validate();
			post('response', { requestId: message.requestId, ok: true, result });
		} catch (error) {
			post('response', { requestId: message.requestId, ok: false, error: serializedError(error) });
		}
		return;
	}
	if (message.type === 'signing-response') {
		const pending = signingRequests.get(message.requestId);
		if (!pending) return;
		signingRequests.delete(message.requestId);
		if (message.ok) pending.resolve(message.result);
		else pending.reject(Object.assign(new Error(message.error?.message || 'Signing failed.'), { code: message.error?.code }));
	}
});

if (channel) {
	parentOrigin = '*';
	parentWindow.postMessage(frameMessage(channel, 'frame-ready'), '*');
	parentOrigin = null;
}
