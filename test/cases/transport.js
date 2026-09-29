import { expect, it, vi } from 'vitest';
import { mount } from '../../src/index.js';
import { EmbedApi } from '../../src/api.js';
import { manifest, response, API_KEY } from '../support/fixtures.js';

export function transportTests() {
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
}
