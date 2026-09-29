import { expect, it, vi } from 'vitest';
import { mount } from '../../src/index.js';
import { styles } from '../../src/styles.js';
import { manifest, response, API_KEY } from '../support/fixtures.js';

export function renderingTests() {
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
		expect(root.querySelector('.brand-organization').href).toBe('https://proseid.com/registry/acme');
		expect(root.querySelector('.brand-organization').target).toBe('_blank');
		expect(root.querySelector('.brand-author').href).toBe('https://proseid.com/registry/publishers/ada');
		expect(root.querySelector('.brand-author').textContent).toContain('@ada');
		expect(root.querySelector('.brand-author').target).toBe('_blank');
		expect(root.querySelector('.brand-author img')).toBeNull();
		expect(root.querySelector('.author-verified').getAttribute('aria-label')).toBe('Verified professional');
		expect(root.querySelector('.language-summary').textContent).toContain('EN');
		expect([...root.querySelectorAll('.language-option')].map((option) => option.textContent)).toEqual(['English', 'Swedish']);
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
}
