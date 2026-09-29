import { expect, it, vi } from 'vitest';
import { mount } from '../../src/index.js';
import { styles } from '../../src/styles.js';
import { manifest, response, API_KEY } from '../support/fixtures.js';

export function guidedCompletionTests() {
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
			expect(root.querySelector('.guided-navigation .primary-action').disabled).toBe(false);
			expect(root.querySelector('.guided-navigation .validation-label').textContent).toBe('1 answer needed');
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
		expect(root.querySelector('.guided-path .active').classList.contains('answered')).toBe(true);
		expect(root.querySelector('.guided-path .active .guided-marker').textContent).toBe('✓');
		expect(styles).toContain('.active.answered .guided-marker');
		expect(styles).toContain('white-space: nowrap');
		root.querySelector('.guided-navigation .primary-action').click();
		await vi.waitFor(() => expect(root.querySelector('.guided-review').hidden).toBe(false));
		expect(root.querySelector('.guided-question').hidden).toBe(true);
		expect(root.querySelector('.guided-path').hidden).toBe(true);
		expect(root.querySelector('.guided-review-readiness .validation-navigator-slot')).toBeDefined();
		expect(root.querySelector('.guided-review-actions .validation-navigator-slot')).toBeNull();
		expect(styles).toContain('.guided-question[hidden]');
		expect(styles).toContain('.guided-review { grid-column: 1 / -1; width: 100%');
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
}
