import { ProseIDError, errorMessage } from './errors.js';
import { VERSION } from './version.js';
import { normalizeAttribution } from './presentation.js';

export function parseFlowCoordinate(value) {
	const parts = String(value ?? '').split('/').filter(Boolean);
	if (parts.length !== 2) throw new ProseIDError('invalid_flow', 'Flow must be "publisher/slug".');
	return { publisher: parts[0], slug: parts[1] };
}

export class EmbedApi {
	constructor({ apiBase = 'https://proseid.com', apiKey, flow, testMode = false, attribution = 'full', fetchImpl = globalThis.fetch }) {
		if (typeof fetchImpl !== 'function') throw new ProseIDError('fetch_unavailable', 'This browser cannot load the Flow.');
		if (!/^proseid_pk_[a-f0-9]{32,64}$/.test(String(apiKey || ''))) {
			throw new ProseIDError('invalid_api_key', 'A ProseID publishable key is required.');
		}
		// Native browser fetch requires its Window/Worker global as the receiver in some runtimes.
		// Binding here keeps the default transport safe while still supporting injected test transports.
		this.fetch = fetchImpl.bind(globalThis);
		this.apiKey = apiKey;
		this.attribution = normalizeAttribution(attribution);
		if (testMode) {
			this.endpoint = `${String(apiBase).replace(/\/$/, '')}/api/embed/v1/test`;
		} else {
			const { publisher, slug } = parseFlowCoordinate(flow);
			this.endpoint = `${String(apiBase).replace(/\/$/, '')}/api/embed/v1/flows/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`;
		}
	}

	setAttribution(value) {
		this.attribution = normalizeAttribution(value);
	}

	async request(body, signal) {
		const response = await this.fetch(this.endpoint, {
			method: body ? 'POST' : 'GET',
			mode: 'cors',
			credentials: 'omit',
				headers: {
				accept: 'application/json',
				'x-proseid-key': this.apiKey,
				'x-proseid-sdk-version': VERSION,
				'x-proseid-attribution': this.attribution,
				...(body ? { 'content-type': 'application/json' } : {})
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

	manifest(signal) {
		return this.request(null, signal);
	}

	validate(flowRef, responses, signal) {
		return this.request({ action: 'validate', flowRef, responses }, signal);
	}

	prepareSigning(flowRef, recordId, responses, signal) {
		return this.request({ action: 'prepare_signing', flowRef, recordId, responses }, signal);
	}

	complete(flowRef, recordId, responses, signature = null, signal) {
		return this.request({ action: 'complete', flowRef, recordId, responses, signature }, signal);
	}

	emailReceipt(flowRef, recordId, email, signal) {
		return this.request({ action: 'email_receipt', flowRef, recordId, email }, signal);
	}
}
