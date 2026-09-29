import { isEmptyValue } from './local-constraints.js';
import { friendlyIssue } from './issue-copy.js';

export function applyDefinitions(definitions) {
	for (const [name, resolved] of Object.entries(definitions)) {
		const field = this.fields.get(name);
		if (!field) continue;
		field.engineVisible = resolved?.visible !== false;
		field.definition = { ...field.definition, ...resolved };
		field.wrap.hidden = !field.engineVisible;
		const required = resolved?.required === true;
		for (const control of field.controls || [field.control]) control.required = required;
		field.required.hidden = !required;
		field.message.textContent = resolved?.ui_message || '';
		field.message.hidden = !resolved?.ui_message;
	}
	if (this.flowType === 'guided_assessment' && this.guidedPhase === 'questions') this.refreshGuided();
	if (this.flowType === 'checklist') this.updateChecklistProgress();
	this.updateAnswerProgress();
	this.updateValidationNavigator();
}

export function clearStaleFieldEvaluation(name) {
	const field = this.fields.get(name);
	if (!field) return;
	field.error.textContent = '';
	field.message.textContent = this.manifest.schema?.definitions?.[name]?.ui_message || '';
	field.message.hidden = !field.message.textContent;
}

export function shouldShow(issue) {
	if (this.submittedAttempted) return true;
	if (issue?.local === true && !isEmptyValue(this.fields.get(issue.field_id)?.definition, this.values[issue.field_id])) return true;
	if (issue?.trigger === 'completion') return false;
	if (issue?.trigger === 'correction') return this.blurred.has(issue.field_id);
	return issue?.severity === 'warning' || issue?.severity === 'notice';
}

export function renderIssues(issues) {
	for (const field of this.fields.values()) {
		field.error.textContent = '';
		for (const control of field.controls || [field.control]) control.setAttribute('aria-invalid', 'false');
	}
	const formIssues = [];
	for (const issue of issues) {
		if (!this.shouldShow(issue)) continue;
		const field = this.fields.get(issue.field_id);
		if (field) {
			field.error.textContent = friendlyIssue(issue, field.label, this.copy);
			for (const control of field.controls || [field.control]) control.setAttribute('aria-invalid', 'true');
		} else formIssues.push(friendlyIssue(issue, 'This field', this.copy));
	}
	if (this.submittedAttempted && this.flowType === 'checklist') {
		for (const name of this.checklistControlNames()) {
			if (this.reviewed.has(name)) continue;
			const field = this.fields.get(name);
			if (!field || field.error.textContent) continue;
			field.error.textContent = this.copy.checklistChoose;
			for (const control of field.controls || [field.control]) control.setAttribute('aria-invalid', 'true');
		}
	}
	this.formError.textContent = formIssues.join(' ');
	this.formError.hidden = formIssues.length === 0;
}
