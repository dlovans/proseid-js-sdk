import { expect, it, vi } from 'vitest';
import { mount } from '../../src/index.js';
import { manifest, response, API_KEY } from '../support/fixtures.js';

export function fieldsTests() {
	it('renders metadata, field information, placeholders, constraints and resolved UI state', async () => {
		const richManifest = {
			...manifest,
			schema: {
				metadata: {
					jurisdictions: ['SE', 'EU'],
					legal_references: [{ instrument: 'Example Act', provision: 'Section 2', source_url: 'https://example.com/act' }]
				},
				definitions: {
					full_name: {
						type: 'string', label: 'Full name', placeholder: 'Ada Lovelace', info: 'Use your legal name.',
						min_length: 2, max_length: 160, pattern: '.+'
					},
					country: { type: 'select', label: 'Country', placeholder: 'Choose a country', options: ['eu_member_state', 'gpai', 'gpai_model', 'direct_ai_interaction', 'annex_iii_large_scale_it_system'] }
				}
			}
		};
		const resolved = {
			...richManifest.schema.definitions,
			full_name: { ...richManifest.schema.definitions.full_name, required: true, ui_message: 'Enter the name shown on your identification.' }
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(richManifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: resolved, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const name = root.querySelector('input[name="full_name"]');
		expect(name.placeholder).toBe('Ada Lovelace');
		expect(name.minLength).toBe(2);
		expect(name.maxLength).toBe(160);
		expect(name.pattern).toBe('.+');
		expect(name.required).toBe(true);
		expect(root.querySelector('.required').textContent).toBe('Required');
		expect(root.querySelector('.info-popover').textContent).toBe('Use your legal name.');
		expect(root.querySelector('.field-message').textContent).toContain('identification');
		expect(root.querySelector('select[name="country"] option').textContent).toBe('Choose a country');
		expect([...root.querySelectorAll('select[name="country"] option')].map((option) => option.textContent)).toEqual([
			'Choose a country',
			'EU member state',
			'GPAI',
			'GPAI model',
			'Direct AI interaction',
			'Annex III large scale IT system'
		]);
		expect(root.querySelector('.schema-details').textContent).toContain('Example Act');
		expect(root.querySelector('.schema-details').textContent).toContain('Sweden');
		expect(root.querySelector('.schema-details').textContent).toContain('SE');
	});

	it('keeps factual yes/no questions unanswered unless the schema supplies a default', async () => {
		const booleanManifest = {
			...manifest,
			schema: { definitions: {
				in_scope: { type: 'boolean', label: 'The organisation is in scope', required: true }
			} }
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(booleanManifest))
			.mockImplementationOnce(() => response({
				ok: true, valid: false, status: 'INCOMPLETE', definitions: booleanManifest.schema.definitions,
				issues: [{ field_id: 'in_scope', severity: 'error', kind: 'missing_required', trigger: 'completion' }]
			}));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_scope_12345678', fetch });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const choices = [...root.querySelectorAll('input[type="radio"][name="in_scope"]')];
		expect(choices).toHaveLength(2);
		expect(choices.every((choice) => choice.checked === false)).toBe(true);
		const request = JSON.parse(fetch.mock.calls[1][1].body);
		expect(request.responses).not.toHaveProperty('in_scope');
	});

	it('moves a Standard Form respondent to the first required answer on submit', async () => {
		const incomplete = {
			ok: true,
			valid: false,
			status: 'INCOMPLETE',
			definitions: manifest.schema.definitions,
			issues: [{ field_id: 'full_name', severity: 'error', kind: 'missing_required', trigger: 'completion' }]
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response(incomplete))
			.mockImplementationOnce(() => response(incomplete));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const input = root.querySelector('input[name="full_name"]');
		const wrapper = input.closest('.field');
		wrapper.scrollIntoView = vi.fn();
		root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
		expect(wrapper.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
		expect(root.activeElement).toBe(input);
	});
}
