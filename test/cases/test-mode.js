import { expect, it, vi } from 'vitest';
import { mountTest } from '../../src/index.js';
import { VERSION } from '../../src/version.js';
import { manifest, response, API_KEY } from '../support/fixtures.js';

export function testModeTests() {
	it('mounts the built-in remote test form without a Flow ID', async () => {
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
		const yearSelect = root.querySelector('.date-year-select');
		const previousYear = String(Number(yearSelect.value) - 1);
		yearSelect.value = previousYear;
		yearSelect.dispatchEvent(new Event('change', { bubbles: true }));
		expect(root.querySelector('.date-year-select').value).toBe(previousYear);
		root.querySelector('.date-panel .today-action').click();
		expect(date.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(root.querySelector('.date-panel')).toBeNull();
	});
}
