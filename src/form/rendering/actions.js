import { text } from '../dom.js';

export function defaultSubmitLabel() {
	if (this.flowType === 'guided_assessment') return this.copy.completeAssessment;
	if (this.flowType === 'determination') return this.copy.confirmDetermination;
	if (this.flowType === 'checklist') return this.copy.completeChecklist;
	return this.copy.submit;
}

export function setButtonBusy(button, busy, label) {
	if (!button) return;
	button.classList.toggle('is-loading', busy);
	button.setAttribute('aria-busy', String(busy));
	button.replaceChildren();
	if (busy) {
		const spinner = text('span', 'button-spinner');
		spinner.setAttribute('aria-hidden', 'true');
		button.append(spinner);
	}
	button.append(text('span', 'button-label', label));
}

export function renderPrivacy() {
	const privacy = text('div', 'privacy');
	privacy.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
	privacy.append(text('span', '', this.attribution === 'hidden' ? this.copy.privacyWhiteLabel : this.copy.privacy));
	return privacy;
}

export function renderActions({ standardForm = false } = {}) {
	const actions = text('div', standardForm ? 'actions standard-form-actions' : 'actions');
	const meta = text('div', 'action-meta');
	meta.append(this.validationNavigator);
	actions.append(meta, this.submitButton);
	return actions;
}

export function updateSubmitState() {
	if (!this.submitButton) return;
	this.submitButton.disabled = this.submitting || this.guidedChecking || this.validationLocked;
	this.updateValidationNavigator();
}

export function setStatus(state, copy) {
	if (!this.statusNode) return;
	this.statusNode.dataset.state = state;
	this.statusNode.querySelector('.status-copy').textContent = copy;
}
