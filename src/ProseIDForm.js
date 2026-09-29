import { EmbedApi } from './api.js';
import { ProseIDError } from './errors.js';
import { SigningCoordinator } from './signing.js';
import { messagesFor } from './i18n.js';
import { normalizeAttribution } from './presentation.js';
import { normalizeLocale, readLocalePreference } from './form/lifecycle/preferences.js';
import { load, seedValues } from './form/lifecycle/load.js';
import { setLocale, renderLanguageSelector } from './form/lifecycle/language.js';
import { applyTheme, applyAppearance } from './form/rendering/appearance.js';
import { installStyles, renderLoading, renderForm } from './form/rendering/shell.js';
import { brand, registryUrl, proseidBrand } from './form/rendering/branding.js';
import { renderSchemaDetails } from './form/rendering/metadata.js';
import { defaultSubmitLabel, setButtonBusy, renderPrivacy, renderActions, updateSubmitState, setStatus } from './form/rendering/actions.js';
import { progressEnabled, renderLedger, visibleFields, updateAnswerProgress, displayValue } from './form/rendering/progress.js';
import { renderFatal } from './form/rendering/fatal.js';
import { renderGuided, refreshGuided } from './form/experiences/guided-layout.js';
import { goToGuidedQuestion, guidedContinue, guidedPrevious, showGuidedReview } from './form/experiences/guided-navigation.js';
import { renderDetermination, refreshDetermination } from './form/experiences/determination.js';
import { renderChecklist, checklistControlNames, updateChecklistProgress, setChecklistBoolean } from './form/experiences/checklist.js';
import { validationProblems, validationNavigatorState } from './form/validation/navigation-state.js';
import { renderValidationNavigator, updateValidationNavigator, navigateToFirstProblem, focusFirstInvalid } from './form/validation/navigation.js';
import { renderDatePicker } from './form/controls/date-picker.js';
import { renderField } from './form/controls/field.js';
import { change } from './form/validation/answers.js';
import { validationRequest, invalidateStaleValidationRequest, scheduleValidation } from './form/validation/request.js';
import { localValidationIssues, renderLocalIssues } from './form/validation/local-issues.js';
import { validate } from './form/validation/remote.js';
import { applyDefinitions, clearStaleFieldEvaluation, shouldShow, renderIssues } from './form/validation/display.js';
import { collectBasicSignature } from './form/completion/signature.js';
import { submit } from './form/completion/submit.js';
import { renderComplete, renderRecordedResult } from './form/completion/result.js';
import { renderReceiptEmail, sendReceipt } from './form/completion/receipt.js';

const randomRecordId = () => `embed_${globalThis.crypto?.randomUUID?.().replaceAll('-', '') || Math.random().toString(36).slice(2).padEnd(16, '0')}`;

const RECORD_ID_RE = /^[A-Za-z0-9_-]{4,128}$/;

/** Owns each mount's state and public methods; focused modules implement the rendering stages. */
export class ProseIDForm {
	constructor(target, options) {
		this.target = typeof target === 'string' ? document.querySelector(target) : target;
		if (!(this.target instanceof Element)) throw new ProseIDError('invalid_target', 'Choose an element to contain the ProseID form.');
		if (!options?.flow && !options?.testMode) throw new ProseIDError('invalid_flow', 'The Flow ID is required.');
		if (!options?.transport && !options?.apiKey) throw new ProseIDError('invalid_api_key', 'A ProseID publishable key is required.');
		this.options = options;
		this.explicitLocale = options.locale ? normalizeLocale(options.locale) : '';
		this.locale = this.explicitLocale || readLocalePreference() || 'en';
		this.copy = messagesFor(this.locale, options.messages);
		this.attribution = normalizeAttribution(options.branding?.proseid);
		this.api = options.transport || new EmbedApi({
			apiBase: options.apiBase,
			apiKey: options.apiKey,
			flow: options.flow,
			testMode: options.testMode === true,
			attribution: this.attribution,
			parentOrigin: options.parentOrigin || globalThis.location?.origin || '',
			fetchImpl: options.fetch
		});
		for (const method of ['manifest', 'validate', 'complete']) {
			if (typeof this.api?.[method] !== 'function') {
				throw new ProseIDError('invalid_transport', `The Flow transport must provide a ${method}() method.`);
			}
		}
		this.signing = new SigningCoordinator(options.signingAdapter);
		this.shadow = this.target.shadowRoot || this.target.attachShadow({ mode: 'open' });
		this.values = {};
		this.fields = new Map();
		this.blurred = new Set();
		this.reviewed = new Set();
		this.submittedAttempted = false;
		this.valid = false;
		this.guidedPhase = 'questions';
		this.guidedIndex = 0;
		this.guidedChecking = false;
		this.destroyed = false;
		this.validationTimer = null;
		this.validationAbort = null;
		this.validationSequence = 0;
		this.validationPromise = null;
		this.validationPromiseFingerprint = '';
		this.lastValidationFingerprint = '';
		this.validationScheduled = false;
		this.validationInFlight = false;
		this.validationNavigatorOpen = false;
		this.submitting = false;
		this.validationLocked = false;
		this.cleanupFns = [];
		const requestedRecordId = String(options.recordId || '').trim();
		if (requestedRecordId && !RECORD_ID_RE.test(requestedRecordId)) {
			throw new ProseIDError('invalid_record_id', 'Use a valid Flow attempt ID.');
		}
		this.recordId = requestedRecordId || randomRecordId();
		this.applyAppearance(options.appearance);
		this.applyTheme(options.theme);
		this.renderLoading();
		this.ready = this.load();
	}

	applyTheme(theme = undefined, manifestColors = undefined) { return applyTheme.call(this, theme, manifestColors); }
	applyAppearance(appearance) { return applyAppearance.call(this, appearance); }
	progressEnabled() { return progressEnabled.call(this); }
	renderLedger(className = undefined) { return renderLedger.call(this, className); }
	installStyles() { return installStyles.call(this); }
	renderLoading() { return renderLoading.call(this); }
	load() { return load.call(this); }
	seedValues() { return seedValues.call(this); }
	setLocale(locale) { return setLocale.call(this, locale); }
	renderLanguageSelector() { return renderLanguageSelector.call(this); }
	brand(publisher) { return brand.call(this, publisher); }
	registryUrl(path) { return registryUrl.call(this, path); }
	proseidBrand() { return proseidBrand.call(this); }
	renderSchemaDetails() { return renderSchemaDetails.call(this); }
	renderForm() { return renderForm.call(this); }
	defaultSubmitLabel() { return defaultSubmitLabel.call(this); }
	setButtonBusy(button, busy, label) { return setButtonBusy.call(this, button, busy, label); }
	renderPrivacy() { return renderPrivacy.call(this); }
	renderActions(options = undefined) { return renderActions.call(this, options); }
	visibleFields() { return visibleFields.call(this); }
	updateAnswerProgress() { return updateAnswerProgress.call(this); }
	displayValue(value, definition) { return displayValue.call(this, value, definition); }
	renderGuided() { return renderGuided.call(this); }
	refreshGuided() { return refreshGuided.call(this); }
	goToGuidedQuestion(name) { return goToGuidedQuestion.call(this, name); }
	guidedContinue() { return guidedContinue.call(this); }
	guidedPrevious() { return guidedPrevious.call(this); }
	showGuidedReview() { return showGuidedReview.call(this); }
	renderDetermination() { return renderDetermination.call(this); }
	refreshDetermination() { return refreshDetermination.call(this); }
	renderChecklist() { return renderChecklist.call(this); }
	checklistControlNames() { return checklistControlNames.call(this); }
	updateChecklistProgress() { return updateChecklistProgress.call(this); }
	updateSubmitState() { return updateSubmitState.call(this); }
	validationProblems() { return validationProblems.call(this); }
	validationNavigatorState() { return validationNavigatorState.call(this); }
	renderValidationNavigator() { return renderValidationNavigator.call(this); }
	updateValidationNavigator() { return updateValidationNavigator.call(this); }
	navigateToFirstProblem(problems = undefined) { return navigateToFirstProblem.call(this, problems); }
	renderDatePicker(id, definition, labelText) { return renderDatePicker.call(this, id, definition, labelText); }
	renderField(name, definition) { return renderField.call(this, name, definition); }
	setChecklistBoolean(name, value) { return setChecklistBoolean.call(this, name, value); }
	change(name, definition, control, immediate = undefined) { return change.call(this, name, definition, control, immediate); }
	validationRequest() { return validationRequest.call(this); }
	invalidateStaleValidationRequest() { return invalidateStaleValidationRequest.call(this); }
	localValidationIssues(names, options = undefined) { return localValidationIssues.call(this, names, options); }
	renderLocalIssues(names, issues = undefined) { return renderLocalIssues.call(this, names, issues); }
	scheduleValidation(delay, names = undefined, options = undefined) { return scheduleValidation.call(this, delay, names, options); }
	validate() { return validate.call(this); }
	applyDefinitions(definitions) { return applyDefinitions.call(this, definitions); }
	clearStaleFieldEvaluation(name) { return clearStaleFieldEvaluation.call(this, name); }
	shouldShow(issue) { return shouldShow.call(this, issue); }
	renderIssues(issues) { return renderIssues.call(this, issues); }
	setStatus(state, copy) { return setStatus.call(this, state, copy); }
	collectBasicSignature() { return collectBasicSignature.call(this); }
	focusFirstInvalid(result = undefined) { return focusFirstInvalid.call(this, result); }
	submit(event) { return submit.call(this, event); }
	renderComplete(result) { return renderComplete.call(this, result); }
	renderRecordedResult(result) { return renderRecordedResult.call(this, result); }
	renderReceiptEmail(result) { return renderReceiptEmail.call(this, result); }
	sendReceipt(event, receipt) { return sendReceipt.call(this, event, receipt); }
	renderFatal(error) { return renderFatal.call(this, error); }

	emit(name, detail) {
		this.target.dispatchEvent(new CustomEvent(`proseid:${name}`, { detail, bubbles: true, composed: true }));
		const callback = this.options[`on${name[0].toUpperCase()}${name.slice(1)}`];
		if (typeof callback === 'function') callback(name === 'error' ? detail.error : detail);
	}

	destroy() {
		this.destroyed = true;
		this.validationSequence += 1;
		clearTimeout(this.validationTimer);
		this.validationScheduled = false;
		this.validationInFlight = false;
		this.validationAbort?.abort();
		this.signatureCancel?.();
		for (const cleanup of this.cleanupFns.splice(0)) cleanup();
		this.shadow.replaceChildren();
		this.fields.clear();
	}
}
