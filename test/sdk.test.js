import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, mountTest, THEME_NAMES, VERSION } from '../src/index.js';

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
		expect(JSON.parse(fetch.mock.calls[1][1].body).effectiveAt).toBe('2026-07-16');
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('h1').textContent).toBe('Client intake');
		expect(root.textContent).toContain('Acme Legal');
		expect(root.textContent).toContain('Verified by');
		expect(root.querySelector('button[type="submit"]').disabled).toBe(true);
	});

	it('tells a respondent to reload when the server rejects a stale legal date', async () => {
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: false, error: 'flow_changed' }, 409));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'acme/intake', fetch });
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
		const instance = mount('#form', { apiKey: API_KEY, flow: 'acme/intake', fetch });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('.guided')).not.toBeNull();
		expect(root.textContent).toContain('Question 1 of 1');
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
		expect(root.querySelector('.required').textContent).toBe('Required');
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

	it('uses the published Flow theme instead of a client-side production override', async () => {
		const styledManifest = {
			...manifest,
			presentation: { ...manifest.presentation, theme: 'forest' }
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(styledManifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'acme/intake', fetch, theme: 'midnight' });
		await instance.ready;
		const target = document.querySelector('#form');
		expect(target.dataset.proseidTheme).toBe('forest');
		expect(target.style.getPropertyValue('--proseid-canvas')).toBe('#151c1a');
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

	it('completes a Guided Assessment through questions, review and one record', async () => {
		const guided = {
			...manifest,
			flow: { ...manifest.flow, flowType: 'guided_assessment', title: 'Guided intake' },
			schema: { definitions: {
				name: { type: 'string', label: 'Your name', required: true },
				country: { type: 'select', label: 'Country', required: true, options: ['Sweden', 'Norway'] }
			} }
		};
		const fetch = vi.fn(async (_url, init) => {
			if (init.method === 'GET') return response(guided);
			const payload = JSON.parse(init.body);
			if (payload.action === 'complete') return response({ ok: true, status: 'completed', recordId: 'guided_record', duplicate: false, delivered: { email: false, webhook: false }, nextAction: null });
			const issues = [];
			if (!payload.responses.name) issues.push({ field_id: 'name', severity: 'error', kind: 'missing_required', trigger: 'correction' });
			if (!payload.responses.country) issues.push({ field_id: 'country', severity: 'error', kind: 'missing_required', trigger: 'correction' });
			return response({ ok: true, valid: issues.length === 0, status: issues.length ? 'INCOMPLETE' : 'READY', definitions: guided.schema.definitions, issues });
		});
		const instance = mount('#form', { apiKey: API_KEY, flow: 'acme/guided', fetch, validateDelay: 100000 });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const name = root.querySelector('input[name="name"]');
		name.value = 'Ada Lovelace';
		name.dispatchEvent(new Event('input', { bubbles: true }));
		root.querySelector('.guided-navigation .primary-action').click();
		await vi.waitFor(() => {
			expect(instance.guidedIndex).toBe(1);
			expect(root.querySelector('.guided-navigation .primary-action').disabled).toBe(false);
		});
		const country = root.querySelector('select[name="country"]');
		country.value = 'Sweden';
		country.dispatchEvent(new Event('change', { bubbles: true }));
		root.querySelector('.guided-navigation .primary-action').click();
		await vi.waitFor(() => expect(root.querySelector('.guided-review').hidden).toBe(false));
		expect(root.querySelector('.review-list').textContent).toContain('Ada Lovelace');
		expect(root.querySelector('.guided-review .submit').disabled).toBe(false);
		root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(root.textContent).toContain('Audit record guided_record'));
		expect(fetch.mock.calls.filter(([, init]) => init.method === 'POST' && JSON.parse(init.body).action === 'complete')).toHaveLength(1);
	});

	it('calculates and confirms a Determination without creating a record during calculation', async () => {
		const determination = {
			...manifest,
			flow: { ...manifest.flow, flowType: 'determination', title: 'Deadline determination' },
			schema: { definitions: {
				hours: { type: 'number', label: 'Hours elapsed', required: true },
				deadline: { type: 'string', label: 'Deadline status', readonly: true, visible: true }
			} }
		};
		let completions = 0;
		const fetch = vi.fn(async (_url, init) => {
			if (init.method === 'GET') return response(determination);
			const payload = JSON.parse(init.body);
			if (payload.action === 'complete') {
				completions += 1;
				return response({ ok: true, status: 'completed', recordId: 'determination_record', duplicate: false, delivered: { email: false, webhook: false }, nextAction: null });
			}
			const valid = payload.responses.hours !== '' && payload.responses.hours != null;
			return response({
				ok: true, valid, status: valid ? 'READY' : 'INCOMPLETE',
				definitions: { ...determination.schema.definitions, deadline: { ...determination.schema.definitions.deadline, value: Number(payload.responses.hours) <= 72 ? 'Within 72 hours' : 'Late' } },
				issues: valid ? [] : [{ field_id: 'hours', severity: 'error', kind: 'missing_required', trigger: 'correction' }]
			});
		});
		const instance = mount('#form', { apiKey: API_KEY, flow: 'acme/determination', fetch, validateDelay: 100000 });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const hours = root.querySelector('input[name="hours"]');
		hours.value = '24';
		hours.dispatchEvent(new Event('input', { bubbles: true }));
		root.querySelector('.determination-facts .primary-action').click();
		await vi.waitFor(() => expect(root.querySelector('.outcome-list')?.textContent).toContain('Within 72 hours'));
		expect(completions).toBe(0);
		expect(root.querySelector('.actions .submit').disabled).toBe(false);
		root.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		await vi.waitFor(() => expect(root.textContent).toContain('Audit record determination_record'));
		expect(completions).toBe(1);
	});

	it('requires every Compliance Checklist control to be explicitly reviewed', async () => {
		const checklist = {
			...manifest,
			flow: { ...manifest.flow, flowType: 'checklist', title: 'Control review' },
			schema: { definitions: {
				reviewer: { type: 'string', label: 'Reviewer', required: true },
				control_met: { type: 'boolean', label: 'Control is met', required: true },
				confirmed: { type: 'attestation', statement: 'I reviewed the evidence', required: true }
			} }
		};
		const fetch = vi.fn(async (_url, init) => {
			if (init.method === 'GET') return response(checklist);
			const payload = JSON.parse(init.body);
			if (payload.action === 'complete') return response({ ok: true, status: 'completed', recordId: 'checklist_record', duplicate: false, delivered: { email: false, webhook: false }, nextAction: null });
			const valid = Boolean(payload.responses.reviewer) && payload.responses.confirmed === true;
			return response({ ok: true, valid, status: valid ? 'READY' : 'INCOMPLETE', definitions: checklist.schema.definitions, issues: [] });
		});
		const instance = mount('#form', { apiKey: API_KEY, flow: 'acme/checklist', fetch, validateDelay: 100000 });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		expect(root.querySelector('.checklist-progress').textContent).toContain('0/2');
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
