import { ProseIDError, errorMessage } from './errors.js';
import { VERSION } from './version.js';

export function parseFormCoordinate(value) {
	const parts = String(value ?? '').split('/').filter(Boolean);
	if (parts.length !== 2) throw new ProseIDError('invalid_form', 'Form must be "publisher/slug".');
	return { publisher: parts[0], slug: parts[1] };
}

export class EmbedApi {
	constructor({ apiBase = 'https://proseid.com', apiKey, form, fetchImpl = globalThis.fetch }) {
		if (typeof fetchImpl !== 'function') throw new ProseIDError('fetch_unavailable', 'This browser cannot load the form.');
		if (!/^proseid_pk_[a-f0-9]{32,64}$/.test(String(apiKey || ''))) {
			throw new ProseIDError('invalid_api_key', 'A ProseID publishable key is required.');
		}
		const { publisher, slug } = parseFormCoordinate(form);
		this.fetch = fetchImpl;
		this.apiKey = apiKey;
		this.endpoint = `${String(apiBase).replace(/\/$/, '')}/api/embed/v1/forms/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`;
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

	validate(formRef, responses, signal) {
		return this.request({ action: 'validate', formRef, responses }, signal);
	}

	prepareSigning(formRef, sessionId, responses, signal) {
		return this.request({ action: 'prepare_signing', formRef, sessionId, responses }, signal);
	}

	complete(formRef, sessionId, responses, signature = null, signal) {
		return this.request({ action: 'complete', formRef, sessionId, responses, signature }, signal);
	}
}
