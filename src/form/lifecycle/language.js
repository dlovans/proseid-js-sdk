import { messagesFor } from '../../i18n.js';
import { normalizeLocale, saveLocalePreference } from './preferences.js';
import { text } from '../dom.js';

export function setLocale(locale) {
	const next = normalizeLocale(locale);
	if (next === this.locale) return;
	const restoreGuidedReview = this.flowType === 'guided_assessment' && this.guidedPhase === 'review';
	this.locale = next;
	this.copy = messagesFor(next, this.options.messages);
	saveLocalePreference(next);
	for (const cleanup of this.cleanupFns.splice(0)) cleanup();
	this.fields.clear();
	this.renderForm();
	if (this.lastValidation) {
		this.applyDefinitions(this.lastValidation.definitions || {});
		this.renderIssues(this.lastValidation.issues || []);
	}
	if (restoreGuidedReview) this.showGuidedReview();
	this.updateSubmitState();
	this.setStatus(
		this.validationInFlight || this.validationScheduled ? 'checking' : this.valid ? 'ready' : 'idle',
		this.validationInFlight || this.validationScheduled ? this.copy.checking : this.valid ? this.copy.ready : this.copy.incomplete
	);
	this.emit('language', { language: next });
}

export function renderLanguageSelector() {
	const wrap = text('div', 'language-controls');
	const selector = text('label', 'language-selector');
	const control = document.createElement('select');
	control.setAttribute('aria-label', this.copy.languageLabel);
	for (const language of ['en', 'sv']) {
		const option = text('option', '', language === 'sv' ? this.copy.swedish : this.copy.english);
		option.value = language;
		control.append(option);
	}
	control.value = this.locale;
	control.addEventListener('change', () => this.setLocale(control.value));
	const chevron = text('span', 'language-chevron');
	chevron.setAttribute('aria-hidden', 'true');
	selector.append(control, chevron);

	const mobile = document.createElement('details');
	mobile.className = 'language-selector-mobile';
	const summary = text('summary', 'language-summary');
	summary.setAttribute('aria-label', this.copy.languageLabel);
	summary.append(
		text('span', 'language-abbreviation', this.locale.toUpperCase()),
		text('span', 'language-summary-chevron')
	);
	const menu = text('div', 'language-menu');
	for (const language of ['en', 'sv']) {
		const option = text('button', 'language-option', language === 'sv' ? this.copy.swedish : this.copy.english);
		option.type = 'button';
		option.dataset.language = language;
		option.setAttribute('aria-current', language === this.locale ? 'true' : 'false');
		option.addEventListener('click', () => {
			mobile.open = false;
			this.setLocale(language);
		});
		menu.append(option);
	}
	mobile.append(summary, menu);
	mobile.addEventListener('keydown', (event) => {
		if (event.key !== 'Escape') return;
		mobile.open = false;
		summary.focus();
	});
	mobile.addEventListener('focusout', (event) => {
		if (!mobile.contains(event.relatedTarget)) mobile.open = false;
	});
	wrap.append(selector, mobile);
	return wrap;
}
