import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, mountTest } from '../src/index.js';
import { EmbedApi } from '../src/api.js';
import { styles } from '../src/styles.js';
import { THEME_NAMES } from '../src/themes.js';
import { VERSION } from '../src/version.js';

const manifest = {
	ok: true,
	apiVersion: '2026-07-16',
	flow: { ref: 'flow_1', flowType: 'form', title: 'Client intake', description: 'Complete this record.', schemaId: 'schema_1', schemaVersion: '1.0.0', effectiveAt: '2026-07-16' },
	publisher: { slug: 'acme', name: 'Acme Legal', logo: null, verified: true },
	branding: { proseid: { name: 'ProseID', logo: 'https://proseid.com/icon-192.png', url: 'https://proseid.com' } },
	presentation: { attribution: 'full', whiteLabel: false, completionMicrons: 200, surchargeMicrons: 0 },
	schema: { definitions: { full_name: { type: 'string', label: 'Full name', required: true } } },
	capabilities: { validation: 'remote', auditRecord: true, receiptEmail: true, signing: { requested: false, available: false, mode: 'none' } }
};

const response = (body, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
const API_KEY = `proseid_pk_${'a'.repeat(40)}`;

beforeEach(() => {
	document.body.innerHTML = '<div id="form"></div>';
	localStorage.clear();
});

describe('ProseID SDK', () => {
	it('renders directly into an isolated shadow root without an iframe', async () => {
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch });
		await instance.ready;
		expect(document.querySelector('iframe')).toBeNull();
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('h1').textContent).toBe('Client intake');
		expect(root.querySelector('.standard-form-actions > .submit')).not.toBeNull();
	});

	it('turns the top rail into real answer progress', async () => {
		const twoFieldManifest = {
			...manifest,
			schema: { definitions: {
				full_name: { type: 'string', label: 'Full name', required: true },
				country: { type: 'select', label: 'Country', required: true, options: ['sweden'] }
			} }
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(twoFieldManifest))
			.mockImplementation(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: twoFieldManifest.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch, validateDelay: 0 });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const progress = root.querySelector('.ledger[role="progressbar"]');
		expect(progress.getAttribute('aria-valuenow')).toBe('0');
		expect(root.querySelector('.ledger-fill').style.width).toBe('0%');
		const name = root.querySelector('input[name="full_name"]');
		name.value = 'Dana Lee';
		name.dispatchEvent(new Event('input', { bubbles: true }));
		expect(progress.getAttribute('aria-valuenow')).toBe('50');
		expect(root.querySelector('.ledger-fill').style.width).toBe('50%');
		const country = root.querySelector('select[name="country"]');
		country.value = 'sweden';
		country.dispatchEvent(new Event('change', { bubbles: true }));
		expect(progress.getAttribute('aria-valuenow')).toBe('100');
		expect(root.querySelector('.ledger-fill').style.width).toBe('100%');
	});

	it('keeps the progress rail on the Flow edge and allows hosts to hide it', async () => {
		expect(styles).toContain('.ledger { position: absolute;');
		expect(styles).toContain('top: -1px; right: -1px; left: -1px;');
		expect(styles).toContain('height: max(4px, var(--proseid-radius));');
		expect(styles).not.toContain('.ledger { position: sticky;');
		expect(styles).toContain('padding: 2px 7px 2px 2px;');
		expect(styles).toContain('.checklist-control-list .check { min-height: 44px;');
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch, showProgress: false });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('.ledger')).toBeNull();
		expect(root.querySelector('h1').textContent).toBe('Client intake');
	});

	it('renders every input variant and counts only non-empty answers', async () => {
		const fieldManifest = {
			...manifest,
			schema: { definitions: {
				short_text: { type: 'string', label: 'Short text', required: true, min_length: 2, max_length: 80, pattern: '.+' },
				long_text: { type: 'string', label: 'Long text', required: true, multiline: true },
				email: { type: 'string', format: 'email', label: 'Email', required: true },
				quantity: { type: 'number', label: 'Quantity', required: true, min: 1, max: 10, step: 1 },
				budget: { type: 'currency', label: 'Budget', required: true, min: 0 },
				country: { type: 'select', label: 'Country', required: true, options: [{ value: 'se', label: 'Sweden' }] },
				date: { type: 'date', label: 'Date', required: true, min: '2025-01-01', max: '2030-12-31' },
				active: { type: 'boolean', label: 'Active', required: true },
				confirm: { type: 'attestation', statement: 'Confirm', required: true }
			} }
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(fieldManifest))
			.mockImplementation(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: fieldManifest.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch, validateDelay: 100000 });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const progress = root.querySelector('.ledger[role="progressbar"]');
		expect(progress.getAttribute('aria-valuetext')).toBe('0 of 9');
		expect(root.querySelector('input[name="short_text"]').type).toBe('text');
		expect(root.querySelector('input[name="short_text"]').minLength).toBe(2);
		expect(root.querySelector('input[name="short_text"]').maxLength).toBe(80);
		expect(root.querySelector('input[name="short_text"]').pattern).toBe('.+');
		expect(root.querySelector('textarea[name="long_text"]')).not.toBeNull();
		expect(root.querySelector('input[name="email"]').type).toBe('email');
		expect(root.querySelector('input[name="quantity"]').type).toBe('number');
		expect(root.querySelector('input[name="quantity"]').step).toBe('1');
		expect(root.querySelector('input[name="budget"]').type).toBe('number');
		expect(root.querySelector('input[name="budget"]').step).toBe('0.01');
		expect(root.querySelector('select[name="country"] option:last-child').textContent).toBe('Sweden');
		expect(root.querySelector('input[name="date"]').type).toBe('text');
		expect(root.querySelectorAll('input[type="radio"][name="active"]')).toHaveLength(2);
		expect(root.querySelector('input[name="confirm"]').getAttribute('role')).toBe('switch');

		const quantity = root.querySelector('input[name="quantity"]');
		quantity.value = '3';
		quantity.dispatchEvent(new Event('input', { bubbles: true }));
		expect(instance.values.quantity).toBe(3);
		expect(progress.getAttribute('aria-valuetext')).toBe('1 of 9');
		quantity.value = '';
		quantity.dispatchEvent(new Event('input', { bubbles: true }));
		expect(instance.values.quantity).toBe('');
		expect(progress.getAttribute('aria-valuetext')).toBe('0 of 9');

		const date = root.querySelector('input[name="date"]');
		date.value = '';
		date.dispatchEvent(new Event('input', { bubbles: true }));
		expect(progress.getAttribute('aria-valuetext')).toBe('0 of 9');
	});

	it('requires a browser-safe publishable key', () => {
		expect(() => mount('#form', { flow: 'flow_12345678', fetch: vi.fn() })).toThrow(/publishable key/i);
		expect(() => mount('#form', { apiKey: `proseid_sk_${'a'.repeat(48)}`, flow: 'flow_12345678', fetch: vi.fn() })).toThrow(/publishable key/i);
	});

	it('uses an injected host transport without requiring or exposing a publishable key', async () => {
		const transport = {
			manifest: vi.fn().mockResolvedValue(manifest),
			validate: vi.fn().mockResolvedValue({
				ok: true,
				valid: true,
				status: 'READY',
				definitions: manifest.schema.definitions,
				issues: []
			}),
			complete: vi.fn(),
			emailReceipt: vi.fn()
		};
		const onChange = vi.fn();
		const instance = mount('#form', {
			flow: 'flow_12345678',
			transport,
			recordId: 'hosted_attempt_123',
			initialValues: { full_name: 'Restored respondent' },
			onChange
		});
		await instance.ready;
		expect(transport.manifest).toHaveBeenCalledWith('hosted_attempt_123');
		expect(document.querySelector('#form').shadowRoot.querySelector('input[name="full_name"]').value)
			.toBe('Restored respondent');
		expect(transport.validate).toHaveBeenCalledWith(
			'flow_1',
			{ full_name: 'Restored respondent' },
			'2026-07-16',
			'en',
			expect.any(AbortSignal)
		);
		expect(onChange).not.toHaveBeenCalled();
	});

	it('restores the canonical completion view without validating or submitting again', async () => {
		const completion = {
			ok: true,
			status: 'completed',
			recordId: 'hosted_record_123',
			effectiveAt: '2026-07-16',
			logicVersion: '1.0.0',
			temporalRange: null,
			duplicate: false,
			delivered: { email: false, webhook: false },
			nextAction: null,
			result: { status: 'READY', outcomes: [], notices: [] }
		};
		const transport = {
			manifest: vi.fn().mockResolvedValue(manifest),
			validate: vi.fn(),
			complete: vi.fn(),
			emailReceipt: vi.fn()
		};
		const onComplete = vi.fn();
		const instance = mount('#form', {
			flow: 'flow_12345678',
			transport,
			recordId: 'hosted_record_123',
			initialCompletion: completion,
			onComplete,
			autoFocusCompletion: false
		});
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('.completion-view')).not.toBeNull();
		expect(root.textContent).toContain('hosted_record_123');
		expect(transport.validate).not.toHaveBeenCalled();
		expect(transport.complete).not.toHaveBeenCalled();
		expect(onComplete).not.toHaveBeenCalled();
	});

	it('accepts HTTPS and localhost API origins but rejects unsafe transport', () => {
		expect(() => new EmbedApi({ apiKey: API_KEY, flow: 'flow_12345678', apiBase: 'http://proseid.example', fetchImpl: vi.fn() }))
			.toThrow(/valid HTTPS/i);
		expect(() => new EmbedApi({ apiKey: API_KEY, flow: 'flow_12345678', apiBase: 'http://localhost:4173', fetchImpl: vi.fn() }))
			.not.toThrow();
	});

	it('loads only by canonical Flow ID', async () => {
		const byId = vi.fn().mockImplementation(() => response(manifest));
		const idApi = new EmbedApi({ apiKey: API_KEY, flow: 'flow_12345678', fetchImpl: byId });
		await idApi.manifest();
		expect(byId.mock.calls[0][0]).toBe('https://proseid.com/api/embed/v1/flow-ids/flow_12345678');

		expect(() => new EmbedApi({ apiKey: API_KEY, flow: 'acme/intake', fetchImpl: vi.fn() }))
			.toThrow(/valid Flow ID/);
	});

	it('renders the co-branded manifest and leaves submit available to reveal missing answers', async () => {
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch });
		await instance.ready;
		expect(fetch.mock.calls[0][1].headers['x-proseid-key']).toBe(API_KEY);
		expect(fetch.mock.calls[0][1].headers['x-proseid-embed-origin']).toBe(location.origin);
		expect(fetch.mock.calls[0][1].headers['x-proseid-attempt-id']).toMatch(/^embed_[A-Za-z0-9_-]{16,}$/);
		expect(JSON.parse(fetch.mock.calls[1][1].body).effectiveAt).toBe('2026-07-16');
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('h1').textContent).toBe('Client intake');
		expect(root.textContent).toContain('Acme Legal');
		expect(root.textContent).toContain('Verified by');
		expect(root.querySelector('button[type="submit"]').disabled).toBe(false);
	});

	it('tells a respondent to reload when the server rejects a stale legal date', async () => {
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: false, error: 'flow_changed' }, 409));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('.form-error').hidden).toBe(false);
		expect(root.textContent).toContain('Reload the page');
		expect(root.querySelector('button[type="submit"]').disabled).toBe(true);
	});

	it('renders a Guided Assessment as a progressive decision path', async () => {
		const guided = {
			...manifest,
			flow: { ...manifest.flow, flowType: 'guided_assessment' }
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(guided))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: guided.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('.guided')).not.toBeNull();
		expect(root.textContent).toContain('Question 1 of 1');
		expect(root.querySelector('.guided-index small').textContent).toContain('Review this final answer');
		expect(root.textContent).toContain('Review answers');
	});

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

	it('uses the schema language by default, lets the respondent switch, and records that choice', async () => {
		const swedishManifest = {
			...manifest,
			flow: { ...manifest.flow, language: 'sv' }
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(swedishManifest))
			.mockImplementationOnce(() => response({ ok: true, valid: true, status: 'READY', definitions: swedishManifest.schema.definitions, issues: [] }))
			.mockImplementationOnce(() => response({ ok: true, status: 'completed', recordId: 'language_record', duplicate: false, delivered: { email: false, webhook: false }, nextAction: null }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch });
		await instance.ready;
		let root = document.querySelector('#form').shadowRoot;
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
		root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(root.textContent).toContain('Audit record language_record'));
		const completion = JSON.parse(fetch.mock.calls[2][1].body);
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

	it('applies bounded appearance, theme and branding overrides', async () => {
		const hiddenManifest = {
			...manifest,
			presentation: { attribution: 'hidden', whiteLabel: true, completionMicrons: 250, surchargeMicrons: 50 }
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(hiddenManifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', {
			apiKey: API_KEY,
			flow: 'flow_12345678',
			fetch,
			appearance: { preset: 'underline', density: 'compact' },
			theme: 'midnight',
			branding: { logoUrl: 'https://customer.example/logo.svg', logoAlt: 'Customer logo', proseid: 'hidden' }
		});
		await instance.ready;
		const target = document.querySelector('#form');
		const root = target.shadowRoot;
		expect(target.dataset).toMatchObject({ proseidShape: 'rigid', proseidFields: 'underline', proseidShell: 'flat', proseidDensity: 'compact' });
		expect(target.dataset.proseidTheme).toBe('midnight');
		expect(target.style.getPropertyValue('--proseid-canvas')).toBe('#111827');
		expect(root.querySelector('.brand img').src).toBe('https://customer.example/logo.svg');
		expect(root.querySelector('.brand img').alt).toBe('Customer logo');
		expect(root.querySelector('.proseid-brand')).toBeNull();
		expect(root.textContent).not.toContain('Checked by ProseID');
		expect(fetch.mock.calls[0][1].headers['x-proseid-attribution']).toBe('hidden');
	});

	it('accepts only curated theme names and falls back safely', async () => {
		expect(THEME_NAMES).toEqual(['light', 'charcoal', 'midnight', 'forest']);
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', {
			apiKey: API_KEY,
			flow: 'flow_12345678',
			fetch,
			theme: { accent: '#000000; background:url(https://evil.example)' }
		});
		await instance.ready;
		const target = document.querySelector('#form');
		expect(target.dataset.proseidTheme).toBe('light');
		expect(target.style.getPropertyValue('--proseid-accent')).toBe('#ff4d1f');
		expect(target.getAttribute('style')).not.toContain('evil.example');
	});

	it('accepts only named six-digit hex colour overrides', async () => {
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', {
			apiKey: API_KEY,
			flow: 'flow_12345678',
			fetch,
			colors: {
				canvas: '#112233',
				accent: '#AABBCC',
				ink: '#fff; background:url(https://evil.example)',
				unknown: '#000000'
			}
		});
		await instance.ready;
		const target = document.querySelector('#form');
		expect(target.style.getPropertyValue('--proseid-canvas')).toBe('#112233');
		expect(target.style.getPropertyValue('--proseid-accent')).toBe('#aabbcc');
		expect(target.style.getPropertyValue('--proseid-ink')).toBe('#171918');
		expect(target.style.getPropertyValue('--proseid-unknown')).toBe('');
	});

	it('uses the published Flow theme instead of a client-side production override', async () => {
		const styledManifest = {
			...manifest,
			presentation: { ...manifest.presentation, theme: 'forest' }
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(styledManifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch, theme: 'midnight' });
		await instance.ready;
		const target = document.querySelector('#form');
		expect(target.dataset.proseidTheme).toBe('forest');
		expect(target.style.getPropertyValue('--proseid-canvas')).toBe('#151c1a');
	});

	it('mounts the built-in remote test form without a Flow ID', async () => {
		const testManifest = {
			...manifest,
			flow: { ...manifest.flow, ref: '__proseid_sdk_test__', title: 'SDK integration test' },
			presentation: { attribution: 'compact', whiteLabel: false, completionMicrons: 0, surchargeMicrons: 0, testMode: true },
			capabilities: { ...manifest.capabilities, auditRecord: false, receiptEmail: false, testMode: true },
			schema: {
				definitions: {
					name: { type: 'string', label: 'Name' },
					count: { type: 'number', label: 'Count' },
					active: { type: 'boolean', label: 'Active' },
					country: { type: 'select', label: 'Country', options: ['Sweden'] },
					date: { type: 'date', label: 'Date' },
					budget: { type: 'currency', label: 'Budget' },
					confirm: { type: 'attestation', statement: 'Confirm' }
				}
			}
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(testManifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: testManifest.schema.definitions, issues: [] }));
		const instance = mountTest('#form', { apiKey: API_KEY, fetch, validateDelay: 100000, branding: { proseid: 'compact' } });
		await instance.ready;
		expect(fetch.mock.calls[0][0]).toContain('/api/embed/v1/test');
		expect(fetch.mock.calls[0][1].headers['x-proseid-sdk-version']).toBe(VERSION);
		expect(document.querySelector('#form').shadowRoot.querySelectorAll('.field')).toHaveLength(7);
		expect(document.querySelector('#form').shadowRoot.querySelector('.proseid-brand.compact')).not.toBeNull();
		expect(document.querySelector('#form').shadowRoot.querySelector('.receipt-copy')).toBeNull();
		const root = document.querySelector('#form').shadowRoot;
		const date = root.querySelector('input[name="date"]');
		expect(date.type).toBe('text');
		root.querySelector('.date-trigger').click();
		expect(root.querySelector('.date-panel')).not.toBeNull();
		const yearSelect = root.querySelector('.date-year-select');
		const previousYear = String(Number(yearSelect.value) - 1);
		yearSelect.value = previousYear;
		yearSelect.dispatchEvent(new Event('change', { bubbles: true }));
		expect(root.querySelector('.date-year-select').value).toBe(previousYear);
		root.querySelector('.date-panel .today-action').click();
		expect(date.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(root.querySelector('.date-panel')).toBeNull();
	});

	it('validates after input and creates an audit completion', async () => {
		vi.useFakeTimers();
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }))
			.mockImplementationOnce(() => response({ ok: true, valid: true, status: 'READY', definitions: manifest.schema.definitions, issues: [] }))
			.mockImplementationOnce(() => response({ ok: true, status: 'completed', recordId: 'audit_123', duplicate: false, delivered: { email: true, webhook: false }, nextAction: null }))
			.mockImplementationOnce(() => response({ ok: true, status: 'sent' }));
		const complete = vi.fn();
		const receipt = vi.fn();
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch, validateDelay: 1, onComplete: complete, onReceipt: receipt });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const input = root.querySelector('input[name="full_name"]');
		input.value = 'Ada Lovelace';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.advanceTimersByTimeAsync(1);
		await Promise.resolve();
		expect(root.querySelector('button[type="submit"]').disabled).toBe(false);
		// A real click moves focus away from the input and fires `change` before the button click.
		// The duplicate event must not invalidate the already-validated value or swallow Submit.
		input.dispatchEvent(new Event('change', { bubbles: true }));
		expect(root.querySelector('button[type="submit"]').disabled).toBe(false);
		root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(complete).toHaveBeenCalledWith(expect.objectContaining({ recordId: 'audit_123' })));
		expect(root.querySelector('.completion-view')).not.toBeNull();
		expect(root.querySelector('.ledger.complete')).not.toBeNull();
		expect(root.querySelector('.ledger.complete.completion-view')).toBeNull();
		expect(root.textContent).toContain('Audit record audit_123');
		expect(root.textContent).toContain('Want a copy for your records?');
		const email = root.querySelector('.receipt-input');
		const emailButton = root.querySelector('.receipt-button');
		expect(emailButton.disabled).toBe(true);
		email.value = 'respondent@example.com';
		email.dispatchEvent(new Event('input', { bubbles: true }));
		expect(emailButton.disabled).toBe(false);
		root.querySelector('.receipt-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(receipt).toHaveBeenCalledWith(expect.objectContaining({
			status: 'sent', recordId: 'audit_123', email: 'respondent@example.com'
		})));
		expect(root.querySelector('.receipt-status').textContent).toContain('respondent@example.com');
		const receiptRequest = JSON.parse(fetch.mock.calls[4][1].body);
		expect(receiptRequest).toEqual({
			action: 'email_receipt', flowRef: 'flow_1', recordId: 'audit_123', email: 'respondent@example.com'
		});
		vi.useRealTimers();
	});

	it('returns authoritative completion validation failures to the relevant field', async () => {
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: true, status: 'READY', definitions: manifest.schema.definitions, issues: [] }))
			.mockImplementationOnce(() => response({
				ok: false,
				error: 'validation_failed',
				status: 'INCOMPLETE',
				issues: [{ field_id: 'full_name', severity: 'error', kind: 'missing_required', trigger: 'completion' }]
			}, 422));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(root.querySelector('.field .error').textContent).toContain('required'));
		expect(root.querySelector('.completion-view')).toBeNull();
		expect(root.querySelector('button[type="submit"]').disabled).toBe(false);
	});

	it('completes a Guided Assessment through questions, review and one record', async () => {
		const guided = {
			...manifest,
			flow: { ...manifest.flow, flowType: 'guided_assessment', title: 'Guided intake' },
			schema: { definitions: {
				name: { type: 'string', label: 'Your name', required: true },
				country: { type: 'select', label: 'Country', required: true, options: ['Sweden', 'Norway'] },
				assessment: { type: 'string', label: 'Assessment outcome', readonly: true, visible: true }
			} }
		};
		const fetch = vi.fn(async (_url, init) => {
			if (init.method === 'GET') return response(guided);
			const payload = JSON.parse(init.body);
			if (payload.action === 'complete') return response({
				ok: true, status: 'completed', recordId: 'guided_record', duplicate: false,
				delivered: { email: false, webhook: false }, nextAction: null,
				result: { status: 'READY', outcomes: [{ fieldId: 'assessment', label: 'Assessment outcome', type: 'string', value: 'Eligible', message: 'Proceed with the next step.' }], notices: [] }
			});
			const issues = [];
			if (!payload.responses.name) issues.push({ field_id: 'name', severity: 'error', kind: 'missing_required', trigger: 'correction' });
			if (!payload.responses.country) issues.push({ field_id: 'country', severity: 'error', kind: 'missing_required', trigger: 'correction' });
			return response({
				ok: true, valid: issues.length === 0, status: issues.length ? 'INCOMPLETE' : 'READY',
				definitions: { ...guided.schema.definitions, assessment: { ...guided.schema.definitions.assessment, value: 'Eligible' } }, issues
			});
		});
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_guided_12345678', fetch, validateDelay: 100000, showProgress: false });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('.guided-progress')).toBeNull();
		expect(root.querySelector('.guided-index').textContent).toContain('Question 1 of 2');
		expect(root.querySelectorAll('.guided-path ol > li')).toHaveLength(2);
		expect(root.querySelector('.guided-path .remaining').textContent).toContain('Country');
		expect(root.querySelector('.guided-path .remaining').textContent).toContain('Not answered');
		expect(root.querySelector('.guided-index small').textContent).toContain('Continue when this answer looks right');
		const name = root.querySelector('input[name="name"]');
		name.focus();
		name.value = 'Ada Lovelace';
		name.dispatchEvent(new Event('input', { bubbles: true }));
		expect(root.activeElement).toBe(name);
		expect(root.querySelector('.guided-path .active').classList.contains('answered')).toBe(true);
		expect(root.querySelector('.guided-path .active .guided-marker').textContent).toBe('✓');
		root.querySelector('.guided-navigation .primary-action').click();
		await vi.waitFor(() => {
			expect(instance.guidedIndex).toBe(1);
			expect(root.querySelector('.guided-navigation .primary-action').disabled).toBe(true);
			expect(root.querySelector('.guided-requirement').hidden).toBe(false);
		});
		const previousAnswer = root.querySelector('.guided-path .answered .guided-path-button');
		previousAnswer.click();
		expect(instance.guidedIndex).toBe(0);
		expect(root.querySelector('input[name="name"]').value).toBe('Ada Lovelace');
		expect(root.querySelector('.guided-path .active').classList.contains('answered')).toBe(true);
		root.querySelector('.guided-navigation .primary-action').click();
		await vi.waitFor(() => expect(instance.guidedIndex).toBe(1));
		const country = root.querySelector('select[name="country"]');
		country.value = 'Sweden';
		country.dispatchEvent(new Event('change', { bubbles: true }));
		root.querySelector('.guided-navigation .primary-action').click();
		await vi.waitFor(() => expect(root.querySelector('.guided-review').hidden).toBe(false));
		expect(root.querySelector('.review-list').textContent).toContain('Ada Lovelace');
		expect(root.textContent).not.toContain('Eligible');
		expect(root.querySelector('.guided-review .submit').disabled).toBe(false);
		root.querySelector('.review-change').click();
		expect(instance.guidedIndex).toBe(0);
		expect(instance.values.country).toBe('Sweden');
		expect(root.querySelector('.guided-path .active').classList.contains('answered')).toBe(true);
		const countryAnswer = [...root.querySelectorAll('.guided-path .answered .guided-path-button')]
			.find((button) => button.textContent.includes('Country'));
		expect(countryAnswer).toBeDefined();
		countryAnswer.click();
		expect(instance.guidedIndex).toBe(1);
		expect(root.querySelector('select[name="country"]').value).toBe('Sweden');
		root.querySelector('.guided-navigation .primary-action').click();
		await vi.waitFor(() => expect(root.querySelector('.guided-review').hidden).toBe(false));
		root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(root.textContent).toContain('Audit record guided_record'));
		expect(root.querySelector('.recorded-result').textContent).toContain('Eligible');
		expect(fetch.mock.calls.filter(([, init]) => init.method === 'POST' && JSON.parse(init.body).action === 'complete')).toHaveLength(1);
	});

	it('checks a Determination live but reveals only the authoritative recorded result after submission', async () => {
		const determination = {
			...manifest,
			flow: { ...manifest.flow, flowType: 'determination', title: 'Deadline determination' },
			schema: {
				metadata: { legal_references: [{ instrument: 'Deadline Act', provision: 'Section 72', source_url: 'https://example.com/deadline' }] },
				definitions: {
				hours: { type: 'number', label: 'Hours elapsed', required: true },
				deadline: { type: 'string', label: 'Deadline status', readonly: true, visible: true }
				}
			}
		};
		let completions = 0;
		const fetch = vi.fn(async (_url, init) => {
			if (init.method === 'GET') return response(determination);
			const payload = JSON.parse(init.body);
			if (payload.action === 'complete') {
				completions += 1;
				return response({
					ok: true, status: 'completed', recordId: 'determination_record', duplicate: false,
					delivered: { email: false, webhook: false }, nextAction: null,
					result: {
						status: 'READY',
						outcomes: [{ fieldId: 'deadline', label: 'Deadline status', type: 'string', value: 'Within 72 hours', message: '' }],
						notices: [{ kind: 'advisory', severity: 'notice', message: 'Confirm the official deadline source.' }]
					}
				});
			}
			const valid = payload.responses.hours !== '' && payload.responses.hours != null;
			return response({
				ok: true, valid, status: valid ? 'READY' : 'INCOMPLETE',
				definitions: { ...determination.schema.definitions, deadline: { ...determination.schema.definitions.deadline, value: Number(payload.responses.hours) <= 72 ? 'Within 72 hours' : 'Late' } },
				issues: valid
					? [{ severity: 'notice', kind: 'advisory', message: 'Confirm the official deadline source.' }]
					: [{ field_id: 'hours', severity: 'error', kind: 'missing_required', trigger: 'correction' }]
			});
		});
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_determination_12345678', fetch, validateDelay: 0 });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('.standard-form-actions')).toBeNull();
		expect(root.querySelector('.determination-result')).toBeNull();
		const hours = root.querySelector('input[name="hours"]');
		hours.value = '24';
		hours.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.waitFor(() => expect(root.querySelector('.actions .submit').disabled).toBe(false));
		expect(root.textContent).not.toContain('Within 72 hours');
		expect(root.textContent).not.toContain('Confirm the official deadline source.');
		expect(completions).toBe(0);
		root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(root.textContent).toContain('Audit record determination_record'));
		expect(root.querySelector('.recorded-result').textContent).toContain('Within 72 hours');
		expect(root.querySelector('.recorded-notices').textContent).toContain('Confirm the official deadline source.');
		expect(completions).toBe(1);
	});

	it('requires every Compliance Checklist control to be explicitly reviewed', async () => {
		const checklist = {
			...manifest,
			flow: { ...manifest.flow, flowType: 'checklist', title: 'Control review' },
			schema: { definitions: {
				reviewer: { type: 'string', label: 'Reviewer', required: true },
				control_met: { type: 'boolean', label: 'Control is met', required: true },
				confirmed: { type: 'attestation', statement: 'I reviewed the evidence', required: true },
				conclusion: { type: 'string', label: 'Review conclusion', readonly: true, visible: true, value: 'Controls current' }
			} }
		};
		const fetch = vi.fn(async (_url, init) => {
			if (init.method === 'GET') return response(checklist);
			const payload = JSON.parse(init.body);
			if (payload.action === 'complete') return response({
				ok: true, status: 'completed', recordId: 'checklist_record', duplicate: false,
				delivered: { email: false, webhook: false }, nextAction: null,
				result: { status: 'READY', outcomes: [{ fieldId: 'conclusion', label: 'Review conclusion', type: 'string', value: 'Controls current', message: '' }], notices: [] }
			});
			const valid = Boolean(payload.responses.reviewer) && payload.responses.confirmed === true;
			return response({ ok: true, valid, status: valid ? 'READY' : 'INCOMPLETE', definitions: checklist.schema.definitions, issues: [] });
		});
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_checklist_12345678', fetch, validateDelay: 100000, showProgress: false });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('.checklist-progress').textContent).toContain('0/2');
		expect(root.querySelector('.checklist-progress-rail')).toBeNull();
		expect(root.querySelector('.checklist-title').textContent).toContain('Auditable compliance completion');
		expect(root.querySelector('.checklist-section-head').textContent).toContain('Identify this review');
		expect(root.querySelector('.checklist-outcomes')).toBeNull();
		expect(root.textContent).not.toContain('Controls current');
		root.querySelector('input[name="reviewer"]').value = 'Ada Lovelace';
		root.querySelector('input[name="reviewer"]').dispatchEvent(new Event('input', { bubbles: true }));
		root.querySelector('.boolean-choice button:last-child').click();
		const attestation = root.querySelector('input[name="confirmed"]');
		attestation.checked = true;
		attestation.dispatchEvent(new Event('change', { bubbles: true }));
		await instance.validate();
		expect(root.querySelector('.checklist-progress').textContent).toContain('2/2');
		expect(root.querySelector('.actions .submit').disabled).toBe(false);
		root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(root.textContent).toContain('Audit record checklist_record'));
		expect(root.querySelector('.recorded-result').textContent).toContain('Controls current');
	});

	it('collects basic signature evidence without requesting a provider signing action', async () => {
		const signedManifest = {
			...manifest,
			capabilities: {
				...manifest.capabilities,
				signing: { requested: true, available: true, provider: null, mode: 'basic' }
			}
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(signedManifest))
			.mockImplementationOnce(() => response({ ok: true, valid: true, status: 'READY', definitions: signedManifest.schema.definitions, issues: [] }))
			.mockImplementationOnce(() => response({ ok: true, status: 'completed', recordId: 'signed_record', duplicate: false, delivered: { email: false, webhook: false }, nextAction: null }));
		const complete = vi.fn();
		const signing = vi.fn();
		const instance = mount('#form', {
			apiKey: API_KEY, flow: 'flow_12345678', fetch, onComplete: complete, onSigning: signing
		});
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(root.querySelector('.signature-dialog')).not.toBeNull());
		const name = root.querySelector('.signature-input');
		const checkbox = root.querySelector('.signature-acknowledgement input');
		name.value = 'Ada Lovelace';
		checkbox.checked = true;
		root.querySelector('.signature-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(complete).toHaveBeenCalledWith(expect.objectContaining({ recordId: 'signed_record' })));
		expect(signing).toHaveBeenCalledWith(expect.objectContaining({
			mode: 'basic', signature: { kind: 'basic', typed_name: 'Ada Lovelace', acknowledged: true }
		}));
		expect(fetch).toHaveBeenCalledTimes(3);
		const completionRequest = JSON.parse(fetch.mock.calls[2][1].body);
		expect(completionRequest.action).toBe('complete');
		expect(completionRequest.signature).toEqual({ kind: 'basic', typed_name: 'Ada Lovelace', acknowledged: true });
	});
});
