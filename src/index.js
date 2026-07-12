import { ProseIDForm } from './ProseIDForm.js';
import { ProseIDError } from './errors.js';
import { VERSION } from './version.js';

export { ProseIDError, ProseIDForm, VERSION };

export function mount(target, options) {
	return new ProseIDForm(target, options);
}

export function mountAll(defaults = {}) {
	return [...document.querySelectorAll('[data-proseid-form]')].map((element) => mount(element, {
		...defaults,
		form: element.getAttribute('data-proseid-form'),
		apiBase: element.getAttribute('data-proseid-api') || defaults.apiBase
	}));
}

