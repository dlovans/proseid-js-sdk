import { ProseIDForm } from './ProseIDForm.js';
import { ProseIDError } from './errors.js';
import { VERSION } from './version.js';

export { ProseIDError, ProseIDForm, VERSION };

export function mount(target, options) {
	return new ProseIDForm(target, options);
}

/** Mount the server-validated built-in field gallery without publishing a form or creating a bill. */
export function mountTest(target, options) {
	return new ProseIDForm(target, { ...options, testMode: true });
}

export function mountAll(defaults = {}) {
	return [...document.querySelectorAll('[data-proseid-form]')].map((element) => mount(element, {
		...defaults,
		form: element.getAttribute('data-proseid-form'),
		apiKey: element.getAttribute('data-proseid-key') || defaults.apiKey,
		apiBase: element.getAttribute('data-proseid-api') || defaults.apiBase
	}));
}
