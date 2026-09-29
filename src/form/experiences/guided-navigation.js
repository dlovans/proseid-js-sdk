import { text } from '../dom.js';

export function goToGuidedQuestion(name) {
	clearTimeout(this.validationTimer);
	const entries = this.visibleFields();
	const index = entries.findIndex(([entryName]) => entryName === name);
	if (index < 0) return;
	this.guidedChecking = false;
	this.guidedPhase = 'questions';
	this.guidedIndex = index;
	this.guidedReview.hidden = true;
	this.guidedQuestion.hidden = false;
	this.guidedPath.hidden = false;
	this.refreshGuided();
	requestAnimationFrame(() => {
		const field = this.fields.get(name);
		const controls = field?.controls || [field?.control];
		(controls.find((control) => control?.checked) || controls.find((control) => control && control.type !== 'hidden'))
			?.focus?.({ preventScroll: true });
	});
}

export async function guidedContinue() {
	if (this.guidedNext.disabled) return;
	clearTimeout(this.validationTimer);
	const entries = this.visibleFields();
	const current = entries[this.guidedIndex];
	if (!current) return;
	const [currentName, currentField] = current;
	this.blurred.add(currentName);
	const localIssues = this.localValidationIssues([currentName], { includeRequired: true });
	this.renderLocalIssues([currentName], localIssues);
	if (localIssues.some((issue) => issue.severity === 'error')) {
		this.refreshGuided();
		currentField.control?.focus?.();
		return;
	}
	this.guidedChecking = true;
	this.guidedNext.disabled = true;
	this.guidedNext.textContent = this.copy.checking;
	const result = await this.validate();
	if (!result) {
		this.guidedChecking = false;
		this.refreshGuided();
		return;
	}
	const blocking = (result?.issues || []).some((issue) => issue.field_id === currentName && issue.severity === 'error');
	if (blocking) {
		this.guidedChecking = false;
		this.refreshGuided();
		return;
	}
	const refreshed = this.visibleFields();
	this.guidedChecking = false;
	if (this.guidedIndex < refreshed.length - 1) {
		this.guidedIndex += 1;
		this.refreshGuided();
		this.guidedFieldSlot.querySelector('input:not([type="hidden"]), select, textarea, button')?.focus?.({ preventScroll: true });
	} else this.showGuidedReview();
}

export function guidedPrevious() {
	if (this.guidedPhase === 'review') {
		this.guidedPhase = 'questions';
		this.guidedIndex = Math.max(0, this.visibleFields().length - 1);
		this.guidedReview.hidden = true;
		this.guidedQuestion.hidden = false;
		this.guidedPath.hidden = false;
		this.refreshGuided();
		return;
	}
	if (this.guidedIndex > 0) {
		this.guidedIndex -= 1;
		this.refreshGuided();
	}
}

export function showGuidedReview() {
	this.guidedPhase = 'review';
	for (const field of this.fields.values()) this.guidedParking.append(field.wrap);
	this.guidedQuestion.hidden = true;
	this.guidedPath.hidden = true;
	this.guidedReview.hidden = false;
	this.guidedReview.replaceChildren();
	const head = text('header', 'review-head');
	head.append(text('span', 'eyebrow', this.copy.finalCheck), text('h2', '', this.copy.reviewTitle), text('p', '', this.copy.reviewHelp));
	const list = text('div', 'review-list');
	this.visibleFields().forEach(([name, field]) => {
		const row = text('div', 'review-row');
		const answer = text('span', 'review-answer');
		answer.append(text('small', '', field.label), text('strong', '', this.displayValue(this.values[name], field.definition)));
		const change = text('button', 'review-change', this.copy.changeAnswer);
		change.type = 'button';
		change.addEventListener('click', () => this.goToGuidedQuestion(name));
		row.append(answer, change);
		list.append(row);
	});
	const actions = text('div', 'guided-review-actions');
	const readiness = text('div', 'guided-review-readiness');
	const back = text('button', 'secondary-action', this.copy.back);
	back.type = 'button';
	back.addEventListener('click', () => this.guidedPrevious());
	readiness.append(this.validationNavigator);
	actions.append(back, this.submitButton);
	this.guidedReview.append(head);
	this.guidedReview.append(list);
	this.guidedReview.append(this.renderPrivacy(), readiness, actions);
	this.updateSubmitState();
}
