import { expect, it, vi } from 'vitest';
import { mount } from '../../src/index.js';
import { manifest, response, API_KEY } from '../support/fixtures.js';

export function completionTests() {
	it('validates after input and creates an audit completion', async () => {
		vi.useFakeTimers();
		let resolveCompletion;
		let resolveReceipt;
		const pendingCompletion = new Promise((resolve) => { resolveCompletion = resolve; });
		const pendingReceipt = new Promise((resolve) => { resolveReceipt = resolve; });
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }))
			.mockImplementationOnce(() => response({ ok: true, valid: true, status: 'READY', definitions: manifest.schema.definitions, issues: [] }))
			.mockImplementationOnce(() => pendingCompletion)
			.mockImplementationOnce(() => pendingReceipt);
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
		await Promise.resolve();
		const submitButton = root.querySelector('.submit');
		expect(submitButton.getAttribute('aria-busy')).toBe('true');
		expect(submitButton.querySelector('.button-spinner')).not.toBeNull();
		expect(submitButton.textContent).toBe('Submitting');
		resolveCompletion(await response({ ok: true, status: 'completed', recordId: 'audit_123', duplicate: false, delivered: { email: true, webhook: false }, nextAction: null }));
		await vi.waitFor(() => expect(complete).toHaveBeenCalledWith(expect.objectContaining({ recordId: 'audit_123' })));
		expect(root.querySelector('.completion-view')).not.toBeNull();
		expect(root.querySelector('.completion-summary .seal').textContent).toBe('✓');
		expect(root.querySelector('.completion-summary-copy').textContent).toContain('Audit record audit_123');
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
		await Promise.resolve();
		expect(emailButton.getAttribute('aria-busy')).toBe('true');
		expect(emailButton.querySelector('.button-spinner')).not.toBeNull();
		expect(emailButton.textContent).toBe('Sending');
		resolveReceipt(await response({ ok: true, status: 'sent' }));
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
}
