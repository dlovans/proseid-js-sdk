import { expect, it, vi } from 'vitest';
import { mount } from '../../src/index.js';
import { manifest, response, API_KEY } from '../support/fixtures.js';

export function languageTests() {
	it('uses the schema language by default, lets the respondent switch, and records that choice', async () => {
		const swedishManifest = {
			...manifest,
			flow: { ...manifest.flow, language: 'sv' },
			schema: { definitions: {
				full_name: { ...manifest.schema.definitions.full_name, value: 'Ada Lovelace' }
			} }
		};
		const fetch = vi.fn(async (_url, init = {}) => {
			if (!init.body) return response(swedishManifest);
			const payload = JSON.parse(init.body);
			if (payload.action === 'complete') {
				return response({ ok: true, status: 'completed', recordId: 'language_record', duplicate: false, delivered: { email: false, webhook: false }, nextAction: null });
			}
			return response({ ok: true, valid: true, status: 'READY', definitions: swedishManifest.schema.definitions, issues: [] });
		});
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch });
		await instance.ready;
		let root = document.querySelector('#form').shadowRoot;
		const validationsBeforeSwitch = fetch.mock.calls
			.map(([, init]) => init?.body ? JSON.parse(init.body) : null)
			.filter((payload) => payload?.action === 'validate').length;
		expect(root.querySelector('.language-selector select').value).toBe('sv');
		expect(root.querySelector('.language-selector select').getAttribute('aria-label')).toBe('Språk');
		expect(root.querySelector('.submit').textContent).toBe('Skicka');
		const languagePicker = root.querySelector('.language-selector select');
		languagePicker.value = 'en';
		languagePicker.dispatchEvent(new Event('change', { bubbles: true }));
		root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('.language-selector select').value).toBe('en');
		expect(root.querySelector('.language-selector select').getAttribute('aria-label')).toBe('Language');
		expect(localStorage.getItem('proseid_flow_language')).toBe('en');
		expect(root.querySelector('input[name="full_name"]').value).toBe('Ada Lovelace');
		expect(root.querySelector('.validation-navigator').dataset.state).toBe('ready');
		const validationsAfterSwitch = fetch.mock.calls
			.map(([, init]) => init?.body ? JSON.parse(init.body) : null)
			.filter((payload) => payload?.action === 'validate').length;
		expect(validationsAfterSwitch).toBe(validationsBeforeSwitch);
		root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(root.textContent).toContain('Audit record language_record'));
		const completion = fetch.mock.calls
			.map(([, init]) => init?.body ? JSON.parse(init.body) : null)
			.find((payload) => payload?.action === 'complete');
		expect(completion.language).toBe('en');
	});

	it('labels the server-issued effective date as an assessment date', async () => {
		const temporalManifest = {
			...manifest,
			flow: {
				...manifest.flow,
				temporalContext: { effective_at: manifest.flow.effectiveAt, logic_version: 'current' }
			}
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(temporalManifest))
			.mockImplementationOnce(() => response({ ok: true, valid: true, status: 'READY', definitions: temporalManifest.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		expect(root.textContent).toContain(`Assessment date: ${manifest.flow.effectiveAt}`);
		expect(root.textContent).not.toContain(`Rules applied on ${manifest.flow.effectiveAt}`);
	});
}
