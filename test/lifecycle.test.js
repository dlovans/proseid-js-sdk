import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '../src/index.js';
import { manifest } from './support/fixtures.js';

const instances = [];
const validation = (valid = false) => ({
	ok: true, valid, status: valid ? 'READY' : 'INCOMPLETE',
	definitions: manifest.schema.definitions, issues: []
});

function transport(overrides = {}) {
	return {
		manifest: vi.fn(async () => manifest),
		validate: vi.fn(async () => validation()),
		complete: vi.fn(),
		...overrides
	};
}

function start(options = {}, target = '#form') {
	const instance = mount(target, {
		flow: 'flow_12345678', transport: transport(), validateDelay: 60_000, ...options
	});
	instances.push(instance);
	return instance;
}

function answer(instance, value) {
	const input = instance.target.shadowRoot.querySelector('input[name="full_name"]');
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
	document.body.innerHTML = '<div id="form"></div><div id="other"></div>';
	localStorage.clear();
});

afterEach(() => {
	for (const instance of instances.splice(0)) instance.destroy();
});

describe('SDK mount lifecycle', () => {
	it('keeps concurrent mounts independent when one changes language or is destroyed', async () => {
		const first = start({ initialValues: { full_name: 'Ada' } });
		const second = start({ initialValues: { full_name: 'Dana' } }, '#other');
		await Promise.all([first.ready, second.ready]);
		const firstRoot = first.target.shadowRoot;
		const language = firstRoot.querySelector('.language-selector select');
		language.value = 'sv';
		language.dispatchEvent(new Event('change', { bubbles: true }));
		expect(first.locale).toBe('sv');
		expect(second.locale).toBe('en');
		expect(firstRoot.querySelector('input[name="full_name"]').value).toBe('Ada');
		first.destroy();
		expect(firstRoot.childElementCount).toBe(0);
		expect(second.target.shadowRoot.querySelector('input[name="full_name"]').value).toBe('Dana');
		await expect(second.validate()).resolves.toEqual(validation());
	});

	it('aborts an outdated request and ignores its late result after newer answers validate', async () => {
		const pending = [];
		const api = transport({ validate: vi.fn()
			.mockResolvedValueOnce(validation())
			.mockImplementation((ref, responses, date, locale, signal) => new Promise((resolve) => {
				pending.push({ resolve, signal });
			})) });
		const onValidation = vi.fn();
		const instance = start({ transport: api, onValidation });
		await instance.ready;
		onValidation.mockClear();
		answer(instance, 'Old answer');
		const stale = instance.validate();
		answer(instance, 'Current answer');
		const current = instance.validate();
		expect(pending[0].signal.aborted).toBe(true);
		pending[1].resolve(validation(true));
		await current;
		pending[0].resolve(validation(false));
		await expect(stale).resolves.toBeNull();
		expect(instance.valid).toBe(true);
		expect(onValidation).toHaveBeenCalledExactlyOnceWith({ valid: true, status: 'READY', issues: [] });
		expect(instance.target.shadowRoot.querySelector('input[name="full_name"]').value).toBe('Current answer');
	});

	it('aborts pending validation on destroy without emitting a late event or rebuilding the form', async () => {
		let finish;
		let signal;
		const api = transport({ validate: vi.fn()
			.mockResolvedValueOnce(validation())
			.mockImplementation((ref, responses, date, locale, requestSignal) => {
				signal = requestSignal;
				return new Promise((resolve) => { finish = resolve; });
			}) });
		const onValidation = vi.fn();
		const instance = start({ transport: api, onValidation });
		await instance.ready;
		onValidation.mockClear();
		answer(instance, 'Ada');
		const pending = instance.validate();
		instance.destroy();
		expect(signal.aborted).toBe(true);
		finish(validation(true));
		await expect(pending).resolves.toBeNull();
		expect(onValidation).not.toHaveBeenCalled();
		expect(instance.target.shadowRoot.childElementCount).toBe(0);
	});

	it('cancels a pending basic signature on destroy without completing a record', async () => {
		const api = transport({
			manifest: vi.fn(async () => ({
				...manifest,
				capabilities: { ...manifest.capabilities, signing: { requested: true, available: true, mode: 'basic' } }
			})),
			validate: vi.fn(async () => validation(true))
		});
		const onComplete = vi.fn();
		const instance = start({ transport: api, initialValues: { full_name: 'Ada' }, onComplete });
		await instance.ready;
		const submitted = instance.submit(new Event('submit', { cancelable: true }));
		await vi.waitFor(() => expect(instance.target.shadowRoot.querySelector('.signature-dialog')).not.toBeNull());
		instance.destroy();
		await submitted;
		expect(api.complete).not.toHaveBeenCalled();
		expect(onComplete).not.toHaveBeenCalled();
		expect(instance.target.shadowRoot.childElementCount).toBe(0);
	});
});
