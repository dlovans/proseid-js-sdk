import { expect, it, vi } from 'vitest';
import { mount } from '../../src/index.js';
import { THEME_NAMES } from '../../src/themes.js';
import { manifest, response, API_KEY } from '../support/fixtures.js';

export function appearanceTests() {
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
			flow: 'flow_12345678',
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
			flow: 'flow_12345678',
			fetch,
			theme: { accent: '#000000; background:url(https://evil.example)' }
		});
		await instance.ready;
		const target = document.querySelector('#form');
		expect(target.dataset.proseidTheme).toBe('light');
		expect(target.style.getPropertyValue('--proseid-accent')).toBe('#ff4d1f');
		expect(target.getAttribute('style')).not.toContain('evil.example');
	});

	it('accepts only named six-digit hex colour overrides', async () => {
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(manifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', {
			apiKey: API_KEY,
			flow: 'flow_12345678',
			fetch,
			colors: {
				canvas: '#112233',
				accent: '#AABBCC',
				ink: '#fff; background:url(https://evil.example)',
				unknown: '#000000'
			}
		});
		await instance.ready;
		const target = document.querySelector('#form');
		expect(target.style.getPropertyValue('--proseid-canvas')).toBe('#112233');
		expect(target.style.getPropertyValue('--proseid-accent')).toBe('#aabbcc');
		expect(target.style.getPropertyValue('--proseid-ink')).toBe('#171918');
		expect(target.style.getPropertyValue('--proseid-unknown')).toBe('');
	});

	it('uses the published Flow theme instead of a client-side production override', async () => {
		const styledManifest = {
			...manifest,
			presentation: { ...manifest.presentation, theme: 'forest' }
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(styledManifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', { apiKey: API_KEY, flow: 'flow_12345678', fetch, theme: 'midnight' });
		await instance.ready;
		const target = document.querySelector('#form');
		expect(target.dataset.proseidTheme).toBe('forest');
		expect(target.style.getPropertyValue('--proseid-canvas')).toBe('#151c1a');
	});

	it.each([
		['light', '#f5f6f5'],
		['charcoal', '#171b1c'],
		['midnight', '#111827'],
		['forest', '#151c1a']
	])('renders the completed view with the %s Flow theme', async (theme, canvas) => {
		const themedManifest = {
			...manifest,
			presentation: {
				...manifest.presentation,
				theme,
				appearance: { shape: 'rigid', fields: 'underline', shell: 'flat', density: 'compact' }
			}
		};
		const completion = {
			ok: true,
			status: 'completed',
			recordId: `record_${theme}`,
			effectiveAt: '2026-07-16',
			logicVersion: '1.0.0',
			temporalRange: null,
			duplicate: false,
			delivered: { email: false, webhook: false },
			nextAction: null,
			result: { status: 'READY', outcomes: [], notices: [] }
		};
		const transport = {
			manifest: vi.fn().mockResolvedValue(themedManifest),
			validate: vi.fn(),
			complete: vi.fn()
		};
		const instance = mount('#form', { flow: 'flow_12345678', transport, initialCompletion: completion });
		await instance.ready;
		const target = document.querySelector('#form');
		expect(target.dataset).toMatchObject({
			proseidTheme: theme,
			proseidShape: 'rigid',
			proseidFields: 'underline',
			proseidShell: 'flat',
			proseidDensity: 'compact'
		});
		expect(target.style.getPropertyValue('--proseid-canvas')).toBe(canvas);
		expect(target.shadowRoot.querySelector('.completion-summary')).not.toBeNull();
	});

	it('applies manifest palette overrides while allowing an embed mount to customize locally', async () => {
		const styledManifest = {
			...manifest,
			presentation: {
				...manifest.presentation,
				theme: 'midnight',
				colors: { canvas: '#123456', accent: '#abcdef' },
				appearance: { shape: 'rigid', fields: 'underline', shell: 'flat', density: 'compact' }
			}
		};
		const fetch = vi.fn()
			.mockImplementationOnce(() => response(styledManifest))
			.mockImplementationOnce(() => response({ ok: true, valid: false, status: 'INCOMPLETE', definitions: manifest.schema.definitions, issues: [] }));
		const instance = mount('#form', {
			apiKey: API_KEY,
			flow: 'flow_12345678',
			fetch,
			colors: { canvas: '#654321' },
			appearance: 'capsule'
		});
		await instance.ready;
		const target = document.querySelector('#form');
		expect(target.style.getPropertyValue('--proseid-canvas')).toBe('#654321');
		expect(target.style.getPropertyValue('--proseid-accent')).toBe('#abcdef');
		expect(target.dataset.proseidShape).toBe('capsule');
	});
}
