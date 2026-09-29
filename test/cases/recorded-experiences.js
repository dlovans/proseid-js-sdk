import { expect, it, vi } from 'vitest';
import { mount } from '../../src/index.js';
import { manifest, response, API_KEY } from '../support/fixtures.js';

export function recordedExperiencesTests() {
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
			.mockImplementationOnce(() => response({ ok: true, valid: true, status: 'READY', definitions: signedManifest.schema.definitions, issues: [] }))
			.mockImplementationOnce(() => response({ ok: true, status: 'completed', recordId: 'signed_record', duplicate: false, delivered: { email: false, webhook: false }, nextAction: null }));
		const complete = vi.fn();
		const signing = vi.fn();
		const instance = mount('#form', {
			apiKey: API_KEY, flow: 'flow_12345678', fetch, onComplete: complete, onSigning: signing
		});
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const fullName = root.querySelector('input[name="full_name"]');
		fullName.value = 'Ada Lovelace';
		fullName.dispatchEvent(new Event('input', { bubbles: true }));
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
		expect(fetch).toHaveBeenCalledTimes(4);
		const completionRequest = JSON.parse(fetch.mock.calls[3][1].body);
		expect(completionRequest.action).toBe('complete');
		expect(completionRequest.signature).toEqual({ kind: 'basic', typed_name: 'Ada Lovelace', acknowledged: true });
	});
}
