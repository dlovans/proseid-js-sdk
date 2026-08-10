import { ProseIDError, errorMessage } from './errors.js';
import { VERSION } from './version.js';
import { normalizeAttribution } from './presentation.js';

export function parseFlowReference(value) {
	const reference = String(value ?? '').trim();
	if (!/^[A-Za-z0-9_-]{1,128}$/.test(reference)) {
		throw new ProseIDError('invalid_flow', 'A valid Flow ID is required.');
	}
	return reference;
}

function normalizedApiBase(value) {
	try {
		const url = new URL(value || 'https://proseid.com');
		const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
		if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password) {
			throw new Error('unsafe');
		}
		return url.origin;
	} catch {
		throw new ProseIDError('invalid_api_base', 'Use a valid HTTPS ProseID address.');
	}
}

export class EmbedApi {
	constructor({ apiBase = 'https://proseid.com', apiKey, flow, testMode = false, attribution = 'full', parentOrigin = '', fetchImpl = globalThis.fetch }) {
		if (typeof fetchImpl !== 'function') throw new ProseIDError('fetch_unavailable', 'This browser cannot load the Flow.');
		if (!/^proseid_pk_[a-f0-9]{32,64}$/.test(String(apiKey || ''))) {
			throw new ProseIDError('invalid_api_key', 'A ProseID publishable key is required.');
		}
		// Native browser fetch requires its Window/Worker global as the receiver in some runtimes.
		// Binding here keeps the default transport safe while still supporting injected test transports.
		this.fetch = fetchImpl.bind(globalThis);
		this.apiKey = apiKey;
		this.attribution = normalizeAttribution(attribution);
		this.parentOrigin = parentOrigin;
		const base = normalizedApiBase(apiBase);
		if (testMode) {
			this.endpoint = `${base}/api/embed/v1/test`;
		} else {
			const flowId = parseFlowReference(flow);
			this.endpoint = `${base}/api/embed/v1/flow-ids/${encodeURIComponent(flowId)}`;
		}
	}

	setAttribution(value) {
		this.attribution = normalizeAttribution(value);
	}

	async request(body, signal, extraHeaders = {}) {
		const response = await this.fetch(this.endpoint, {
			method: body ? 'POST' : 'GET',
			mode: 'cors',
			credentials: 'omit',
				headers: {
				accept: 'application/json',
				'x-proseid-key': this.apiKey,
				'x-proseid-sdk-version': VERSION,
				'x-proseid-attribution': this.attribution,
				...(this.parentOrigin ? { 'x-proseid-embed-origin': this.parentOrigin } : {}),
				...(body ? { 'content-type': 'application/json' } : {}),
				...extraHeaders
			},
			...(body ? { body: JSON.stringify(body) } : {}),
			...(signal ? { signal } : {})
		});
		const payload = await response.json().catch(() => ({}));
		if (!response.ok || payload?.ok === false) {
			const code = payload?.error || `http_${response.status}`;
			throw new ProseIDError(code, errorMessage(code), response.status, payload);
		}
		return payload;
	}

	manifest(attemptId, signal) {
		return this.request(null, signal, {
			...(attemptId ? { 'x-proseid-attempt-id': attemptId } : {})
		});
	}

	validate(flowRef, responses, effectiveAt, language, signal) {
		return this.request({ action: 'validate', flowRef, responses, effectiveAt, language }, signal);
	}

	prepareSigning(flowRef, recordId, responses, effectiveAt, signal) {
		return this.request({ action: 'prepare_signing', flowRef, recordId, responses, effectiveAt }, signal);
	}

	complete(flowRef, recordId, responses, effectiveAt, signature = null, language = 'en', signal) {
		return this.request({ action: 'complete', flowRef, recordId, responses, effectiveAt, signature, language }, signal);
	}

	emailReceipt(flowRef, recordId, email, signal) {
		return this.request({ action: 'email_receipt', flowRef, recordId, email }, signal);
	}
}
