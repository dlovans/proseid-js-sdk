import { expect, it, vi } from 'vitest';
import { mount } from '../../src/index.js';
import { styles } from '../../src/styles.js';
import { manifest, response, API_KEY } from '../support/fixtures.js';

export function guidedValidationTests() {
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
		expect(root.querySelector('.guided-path ol').tabIndex).toBe(0);
		expect(root.querySelector('.guided-path ol').getAttribute('aria-label')).toBe('Decision path');
		expect(root.querySelector('.guided-index small').textContent).toContain('Review this final answer');
		expect(root.textContent).toContain('Review answers');
		expect(styles).toContain('scrollbar-color: transparent transparent');
		expect(styles).toContain('.guided-path ol:hover::-webkit-scrollbar-thumb');
		expect(styles).toContain('.guided-path li.active {');
		expect(styles).toContain('background: color-mix(in srgb, var(--proseid-accent) 7%, var(--proseid-surface))');
	});

	it('preserves the guided decision-path scroll position when an answer updates its marker', async () => {
		const definitions = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [
			`answer_${index + 1}`,
			{ type: 'string', label: `Answer ${index + 1}`, required: true }
		]));
		const guided = {
			...manifest,
			flow: { ...manifest.flow, flowType: 'guided_assessment' },
			schema: { definitions }
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(guided))
			.mockImplementation(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_guided_12345678', fetch, validateDelay: 100000 });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const originalPath = root.querySelector('.guided-path ol');
		const originalFirstItem = originalPath.children[0];
		const originalSecondItem = originalPath.children[1];
		originalPath.scrollTop = 96;
		const input = root.querySelector('input[name="answer_1"]');
		input.value = 'Recorded answer';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		const refreshedPath = root.querySelector('.guided-path ol');
		expect(refreshedPath).toBe(originalPath);
		expect(refreshedPath.children[0]).toBe(originalFirstItem);
		expect(refreshedPath.scrollTop).toBe(96);
		expect(refreshedPath.querySelector('.active .guided-marker').textContent).toBe('✓');
		root.querySelector('.guided-navigation .primary-action').click();
		await vi.waitFor(() => expect(instance.guidedIndex).toBe(1));
		expect(refreshedPath.children[0]).toBe(originalFirstItem);
		expect(refreshedPath.children[1]).toBe(originalSecondItem);
		expect(originalFirstItem.classList.contains('active')).toBe(false);
		expect(originalSecondItem.classList.contains('active')).toBe(true);
	});

	it('shows public field-constraint errors locally and reuses the matching live result on Continue', async () => {
		const guided = {
			...manifest,
			flow: { ...manifest.flow, flowType: 'guided_assessment' },
			schema: { definitions: { name: { type: 'string', label: 'Your name', required: true, min_length: 2 } } }
		};
		const transport = {
			manifest: vi.fn().mockResolvedValue(guided),
			validate: vi.fn(async (_flow, responses) => ({
				ok: true,
				valid: String(responses.name || '').length >= 2,
				status: String(responses.name || '').length >= 2 ? 'READY' : 'INCOMPLETE',
				definitions: guided.schema.definitions,
				issues: []
			})),
			complete: vi.fn(),
			emailReceipt: vi.fn()
		};
		const instance = mount('#form', { flow: 'flow_guided_12345678', transport, validateDelay: 5 });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const input = root.querySelector('input[name="name"]');
		input.value = 'x';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.waitFor(() => expect(root.querySelector('.field .error').textContent).toContain('too short'));
		expect(transport.validate).toHaveBeenCalledTimes(1);
		root.querySelector('.guided-navigation .primary-action').click();
		expect(transport.validate).toHaveBeenCalledTimes(1);
		expect(instance.guidedPhase).toBe('questions');

		input.value = 'Ada';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.waitFor(() => expect(transport.validate).toHaveBeenCalledTimes(2));
		root.querySelector('.guided-navigation .primary-action').click();
		await vi.waitFor(() => expect(instance.guidedPhase).toBe('review'));
		expect(transport.validate).toHaveBeenCalledTimes(2);
	});

	it('checks a locally valid typed answer sooner without overriding an explicit validation delay', async () => {
		const guided = {
			...manifest,
			flow: { ...manifest.flow, flowType: 'guided_assessment' },
			schema: { definitions: { name: { type: 'string', label: 'Your name', required: true, min_length: 2 } } }
		};
		const transport = {
			manifest: vi.fn().mockResolvedValue(guided),
			validate: vi.fn().mockResolvedValue({ ok: true, valid: false, status: 'INCOMPLETE', definitions: guided.schema.definitions, issues: [] }),
			complete: vi.fn(),
			emailReceipt: vi.fn()
		};
		const instance = mount('#form', { flow: 'flow_guided_12345678', transport });
		await instance.ready;
		const schedule = vi.spyOn(instance, 'scheduleValidation');
		const input = document.querySelector('#form').shadowRoot.querySelector('input[name="name"]');

		input.value = 'x';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(schedule).toHaveBeenLastCalledWith(400, ['name']);

		input.value = 'Ada';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(schedule).toHaveBeenLastCalledWith(180, ['name']);
		instance.destroy();

		document.body.innerHTML = '<div id="form"></div>';
		const configured = mount('#form', { flow: 'flow_guided_12345678', transport, validateDelay: 900 });
		await configured.ready;
		const configuredSchedule = vi.spyOn(configured, 'scheduleValidation');
		const configuredInput = document.querySelector('#form').shadowRoot.querySelector('input[name="name"]');
		configuredInput.value = 'Ada';
		configuredInput.dispatchEvent(new Event('input', { bubbles: true }));
		expect(configuredSchedule).toHaveBeenLastCalledWith(900, ['name']);
		configured.destroy();
	});

	it('reuses an in-flight live validation when Guided Continue is clicked', async () => {
		const guided = {
			...manifest,
			flow: { ...manifest.flow, flowType: 'guided_assessment' },
			schema: { definitions: { name: { type: 'string', label: 'Your name', required: true } } }
		};
		let resolveLive;
		const liveResult = new Promise((resolve) => { resolveLive = resolve; });
		const transport = {
			manifest: vi.fn().mockResolvedValue(guided),
			validate: vi.fn()
				.mockResolvedValueOnce({ ok: true, valid: false, status: 'INCOMPLETE', definitions: guided.schema.definitions, issues: [] })
				.mockImplementationOnce(() => liveResult),
			complete: vi.fn(),
			emailReceipt: vi.fn()
		};
		const instance = mount('#form', { flow: 'flow_guided_12345678', transport, validateDelay: 0 });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const input = root.querySelector('input[name="name"]');
		input.value = 'Ada';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.waitFor(() => expect(transport.validate).toHaveBeenCalledTimes(2));
		root.querySelector('.guided-navigation .primary-action').click();
		expect(transport.validate).toHaveBeenCalledTimes(2);
		resolveLive({ ok: true, valid: true, status: 'READY', definitions: guided.schema.definitions, issues: [] });
		await vi.waitFor(() => expect(instance.guidedPhase).toBe('review'));
		expect(transport.validate).toHaveBeenCalledTimes(2);
	});
}
