import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, mountTest, THEME_NAMES, VERSION } from '../src/index.js';

const manifest = {
	ok: true,
	apiVersion: '2026-07-15',
	flow: { ref: 'flow_1', flowType: 'form', title: 'Client intake', description: 'Complete this record.', schemaId: 'schema_1', schemaVersion: '1.0.0' },
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
});

describe('ProseID SDK', () => {
	it('requires a browser-safe publishable key', () => {
		expect(() => mount('#form', { flow: 'acme/intake', fetch: vi.fn() })).toThrow(/publishable key/i);
		expect(() => mount('#form', { apiKey: `proseid_sk_${'a'.repeat(48)}`, flow: 'acme/intake', fetch: vi.fn() })).toThrow(/publishable key/i);
	});

	it('renders the co-branded manifest and begins with submit gated', async () => {
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'acme/intake', fetch });
		await instance.ready;
		expect(fetch.mock.calls[0][1].headers['x-proseid-key']).toBe(API_KEY);
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('h1').textContent).toBe('Client intake');
		expect(root.textContent).toContain('Acme Legal');
		expect(root.textContent).toContain('Verified by');
		expect(root.querySelector('button[type="submit"]').disabled).toBe(true);
	});

	it('refuses a non-form Flow instead of rendering the wrong interaction', async () => {
		const fetch = vi.fn().mockImplementationOnce(() => response({
			...manifest,
			flow: { ...manifest.flow, flowType: 'guided_assessment' }
		}));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'acme/intake', fetch });
		await expect(instance.ready).rejects.toMatchObject({ code: 'flow_type_not_supported' });
		expect(document.querySelector('#form').shadowRoot.textContent).toContain('Only Standard Form Flows');
		expect(fetch).toHaveBeenCalledTimes(1);
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
					country: { type: 'select', label: 'Country', placeholder: 'Choose a country', options: ['Sweden'] }
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
		const instance = mount('#form', { apiKey: API_KEY, flow: 'acme/intake', fetch });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const name = root.querySelector('input[name="full_name"]');
		expect(name.placeholder).toBe('Ada Lovelace');
		expect(name.minLength).toBe(2);
		expect(name.maxLength).toBe(160);
		expect(name.pattern).toBe('.+');
		expect(name.required).toBe(true);
		expect(root.querySelector('.info-popover').textContent).toBe('Use your legal name.');
		expect(root.querySelector('.field-message').textContent).toContain('identification');
		expect(root.querySelector('select[name="country"] option').textContent).toBe('Choose a country');
		expect(root.querySelector('.schema-details').textContent).toContain('Example Act');
		expect(root.querySelector('.schema-details').textContent).toContain('Sweden');
		expect(root.querySelector('.schema-details').textContent).toContain('SE');
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
			flow: 'acme/intake',
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
			flow: 'acme/intake',
			fetch,
			theme: { accent: '#000000; background:url(https://evil.example)' }
		});
		await instance.ready;
		const target = document.querySelector('#form');
		expect(target.dataset.proseidTheme).toBe('light');
		expect(target.style.getPropertyValue('--proseid-accent')).toBe('#ff4d1f');
		expect(target.getAttribute('style')).not.toContain('evil.example');
	});

	it('mounts the built-in remote test form without a Flow coordinate', async () => {
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
		const instance = mountTest('#form', { apiKey: API_KEY, fetch, branding: { proseid: 'compact' } });
		await instance.ready;
		expect(fetch.mock.calls[0][0]).toContain('/api/embed/v1/test');
		expect(fetch.mock.calls[0][1].headers['x-proseid-sdk-version']).toBe(VERSION);
		expect(document.querySelector('#form').shadowRoot.querySelectorAll('.field')).toHaveLength(7);
		expect(document.querySelector('#form').shadowRoot.querySelector('.proseid-brand.compact')).not.toBeNull();
		expect(document.querySelector('#form').shadowRoot.querySelector('.receipt-copy')).toBeNull();
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
		const instance = mount('#form', { apiKey: API_KEY, flow: 'acme/intake', fetch, validateDelay: 1, onComplete: complete, onReceipt: receipt });
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
			apiKey: API_KEY, flow: 'acme/intake', fetch, onComplete: complete, onSigning: signing
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
