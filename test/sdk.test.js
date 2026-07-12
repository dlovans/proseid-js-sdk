import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, mountTest, VERSION } from '../src/index.js';

const manifest = {
	ok: true,
	apiVersion: '2026-07-12',
	form: { ref: 'form_1', title: 'Client intake', description: 'Complete this record.', schemaId: 'schema_1', schemaVersion: '1.0.0' },
	publisher: { slug: 'acme', name: 'Acme Legal', logo: null, verified: true },
	branding: { proseid: { name: 'ProseID', logo: 'https://proseid.com/icon-192.png', url: 'https://proseid.com' } },
	presentation: { attribution: 'full', whiteLabel: false, completionMicrons: 200, surchargeMicrons: 0 },
	schema: { definitions: { full_name: { type: 'string', label: 'Full name', required: true } } },
	capabilities: { validation: 'remote', auditRecord: true, signing: { requested: false, available: false, mode: 'none' } }
};

const response = (body, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));
const API_KEY = `proseid_pk_${'a'.repeat(40)}`;

beforeEach(() => {
	document.body.innerHTML = '<div id="form"></div>';
});

describe('ProseID SDK', () => {
	it('requires a browser-safe publishable key', () => {
		expect(() => mount('#form', { form: 'acme/intake', fetch: vi.fn() })).toThrow(/publishable key/i);
		expect(() => mount('#form', { apiKey: `proseid_sk_${'a'.repeat(48)}`, form: 'acme/intake', fetch: vi.fn() })).toThrow(/publishable key/i);
	});

	it('renders the co-branded manifest and begins with submit gated', async () => {
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, form: 'acme/intake', fetch });
		await instance.ready;
		expect(fetch.mock.calls[0][1].headers['x-proseid-key']).toBe(API_KEY);
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('h1').textContent).toBe('Client intake');
		expect(root.textContent).toContain('Acme Legal');
		expect(root.textContent).toContain('Verified by');
		expect(root.querySelector('button[type="submit"]').disabled).toBe(true);
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
			form: 'acme/intake',
			fetch,
			appearance: { preset: 'underline', density: 'compact' },
			theme: { background: '#f1f2f3', text: '#101112', border: '#cccccc' },
			branding: { logoUrl: 'https://customer.example/logo.svg', logoAlt: 'Customer logo', proseid: 'hidden' }
		});
		await instance.ready;
		const target = document.querySelector('#form');
		const root = target.shadowRoot;
		expect(target.dataset).toMatchObject({ proseidShape: 'rigid', proseidFields: 'underline', proseidShell: 'flat', proseidDensity: 'compact' });
		expect(target.style.getPropertyValue('--proseid-canvas')).toBe('#f1f2f3');
		expect(root.querySelector('.brand img').src).toBe('https://customer.example/logo.svg');
		expect(root.querySelector('.brand img').alt).toBe('Customer logo');
		expect(root.querySelector('.proseid-brand')).toBeNull();
		expect(root.textContent).not.toContain('Checked by ProseID');
		expect(fetch.mock.calls[0][1].headers['x-proseid-attribution']).toBe('hidden');
	});

	it('mounts the built-in remote test form without a form coordinate', async () => {
		const testManifest = {
			...manifest,
			form: { ...manifest.form, ref: '__proseid_sdk_test__', title: 'SDK integration test' },
			presentation: { attribution: 'compact', whiteLabel: false, completionMicrons: 0, surchargeMicrons: 0, testMode: true },
			capabilities: { ...manifest.capabilities, auditRecord: false, testMode: true },
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
	});

	it('validates after input and creates an audit completion', async () => {
		vi.useFakeTimers();
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }))
			.mockImplementationOnce(() => response({ ok: true, valid: true, status: 'READY', definitions: manifest.schema.definitions, issues: [] }))
			.mockImplementationOnce(() => response({ ok: true, status: 'completed', sessionId: 'audit_123', duplicate: false, delivered: { email: true, webhook: false }, nextAction: null }));
		const complete = vi.fn();
		const instance = mount('#form', { apiKey: API_KEY, form: 'acme/intake', fetch, validateDelay: 1, onComplete: complete });
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
		await vi.waitFor(() => expect(complete).toHaveBeenCalledWith(expect.objectContaining({ sessionId: 'audit_123' })));
		expect(root.textContent).toContain('Audit record audit_123');
		vi.useRealTimers();
	});
});
