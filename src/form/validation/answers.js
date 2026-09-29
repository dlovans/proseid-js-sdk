import { answerProvided, localConstraintIssue } from './local-constraints.js';

export function change(name, definition, control, immediate = false) {
	const wasProvided = answerProvided(definition, this.values[name]);
	const value = definition.type === 'boolean'
		? (control.type === 'radio' ? control.value === 'true' : control.checked)
		: definition.type === 'attestation'
			? control.checked
		: ['number', 'currency'].includes(definition.type) && control.value !== ''
			? Number(control.value)
			: control.value;
	// Browsers fire `change` again when a filled control loses focus. Do not invalidate a value
	// that the server has already approved: doing so can disable Submit between pointer-down and
	// click when the user moves directly from the last field to the button.
	if (this.flowType === 'checklist' && ['boolean', 'attestation'].includes(definition.type)) {
		this.reviewed.add(name);
		this.updateChecklistProgress();
	}
	if (Object.is(this.values[name], value)) {
		this.updateSubmitState();
		return;
	}
	this.values[name] = value;
	const isProvided = answerProvided(definition, value);
	this.updateAnswerProgress();
	if (definition.type === 'boolean') {
		const field = this.fields.get(name);
		field?.choiceLabels?.yes.classList.toggle('selected', value === true);
		field?.choiceLabels?.no.classList.toggle('selected', value === false);
	}
	this.valid = false;
	if (this.flowType === 'checklist' && ['boolean', 'attestation'].includes(definition.type)) this.clearStaleFieldEvaluation(name);
	if (this.flowType === 'determination' && this.determinationActivity) {
		this.determinationActivity.classList.add('evaluating');
		this.determinationActivity.querySelector('span').textContent = this.copy.determinationUpdating;
	}
	if (this.flowType === 'guided_assessment' && this.guidedPhase === 'questions' && wasProvided !== isProvided) this.refreshGuided();
	this.updateSubmitState();
	this.setStatus('checking', this.copy.checking);
	this.emit('change', { name, value: this.values[name], values: { ...this.values } });
	this.invalidateStaleValidationRequest();
	const activeDefinition = this.fields.get(name)?.definition || definition;
	const locallyValid = answerProvided(activeDefinition, value)
		&& !localConstraintIssue(name, activeDefinition, value, { includeRequired: true });
	const validationDelay = immediate
		? 0
		: this.options.validateDelay ?? (locallyValid ? LOCALLY_VALID_VALIDATION_DELAY : DEFAULT_VALIDATION_DELAY);
	this.scheduleValidation(validationDelay, [name]);
}

export const DEFAULT_VALIDATION_DELAY = 400;

export const LOCALLY_VALID_VALIDATION_DELAY = 180;
