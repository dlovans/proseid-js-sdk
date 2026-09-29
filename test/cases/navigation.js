import { expect, it, vi } from 'vitest';
import { mount } from '../../src/index.js';
import { styles } from '../../src/styles.js';
import { manifest, response, API_KEY } from '../support/fixtures.js';

export function navigationTests() {
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

	it('turns answer status into a smooth navigator without disabling completion', async () => {
		const twoFieldManifest = {
			...manifest,
			schema: { definitions: {
				full_name: { type: 'string', label: 'Full name', required: true, min_length: 3 },
				country: { type: 'select', label: 'Country', required: true, options: ['se'] }
			} }
		};
		const transport = {
			manifest: vi.fn().mockResolvedValue(twoFieldManifest),
			validate: vi.fn(async (_flow, values) => ({
				ok: true,
				valid: values.full_name === 'Ada' && values.country === 'se',
				status: values.full_name === 'Ada' && values.country === 'se' ? 'READY' : 'INCOMPLETE',
				definitions: twoFieldManifest.schema.definitions,
				issues: []
			})),
			complete: vi.fn(),
			emailReceipt: vi.fn()
		};
		const instance = mount('#form', { flow: 'flow_12345678', transport, validateDelay: 5 });
		await instance.ready;
		const root = document.querySelector('#form').shadowRoot;
		const navigator = root.querySelector('.validation-navigator');
		const orb = root.querySelector('.validation-orb');
		expect(navigator.closest('.action-meta')).not.toBeNull();
		expect(root.querySelector('.action-meta .privacy')).toBeNull();
		expect(styles).toContain('border-radius: var(--proseid-button-radius)');
		expect(styles).toContain('border-radius: var(--proseid-control-radius)');
		expect(navigator.dataset.state).toBe('needed');
		expect(orb.textContent).toBe('2');
		expect(root.querySelector('.validation-label').textContent).toBe('2 answers needed');
		expect(root.querySelector('.submit').disabled).toBe(false);

		orb.click();
		expect(navigator.dataset.open).toBe('true');
		root.querySelector('.validation-jump').click();
		const name = root.querySelector('input[name="full_name"]');
		expect(root.activeElement).toBe(name);
		expect(name.getAttribute('aria-invalid')).toBe('true');

		name.value = 'x';
		name.dispatchEvent(new Event('input', { bubbles: true }));
		await vi.waitFor(() => expect(navigator.dataset.state).toBe('attention'));
		expect(root.querySelector('.validation-label').textContent).toBe('2 answers need attention');

		name.value = 'Ada';
		name.dispatchEvent(new Event('input', { bubbles: true }));
		const country = root.querySelector('select[name="country"]');
		country.value = 'se';
		country.dispatchEvent(new Event('change', { bubbles: true }));
		expect(navigator.dataset.state).toBe('checking');
		await vi.waitFor(() => expect(navigator.dataset.state).toBe('ready'));
		expect(root.querySelector('.validation-label').textContent).toBe('Ready to complete');
		expect(orb.textContent).toBe('✓');
		expect(root.querySelector('.submit').disabled).toBe(false);
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
}
