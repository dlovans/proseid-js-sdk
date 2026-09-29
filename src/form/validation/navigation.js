import { answerProvided } from './local-constraints.js';
import { text } from '../dom.js';

export function renderValidationNavigator() {
	const wrap = text('div', 'validation-navigator-slot');
	const navigator = text('div', 'validation-navigator');
	navigator.dataset.open = 'false';
	navigator.dataset.state = 'checking';
	const id = `proseid-answer-status-${this.recordId}`;
	const toggle = text('button', 'validation-orb');
	toggle.type = 'button';
	toggle.setAttribute('aria-controls', id);
	toggle.setAttribute('aria-expanded', 'false');
	this.validationOrbValue = text('span', 'validation-orb-value');
	this.validationOrbValue.setAttribute('aria-hidden', 'true');
	toggle.append(this.validationOrbValue);
	const reveal = text('div', 'validation-reveal');
	reveal.id = id;
	const jump = text('button', 'validation-jump');
	jump.type = 'button';
	this.validationCopy = text('span', 'validation-copy');
	this.validationLabel = text('strong', 'validation-label');
	this.validationLabel.setAttribute('aria-live', 'polite');
	this.validationDetail = text('small', 'validation-detail');
	this.validationCopy.append(this.validationLabel, this.validationDetail);
	this.validationArrow = text('span', 'validation-arrow', '→');
	this.validationArrow.setAttribute('aria-hidden', 'true');
	jump.append(this.validationCopy, this.validationArrow);
	reveal.append(jump);
	// Keep the control attached to the Flow edge while the detail rail opens inward.
	navigator.append(reveal, toggle);
	wrap.append(navigator);

	toggle.addEventListener('click', () => {
		this.validationNavigatorOpen = !this.validationNavigatorOpen;
		this.updateValidationNavigator();
	});
	jump.addEventListener('click', () => {
		const state = this.validationNavigatorState();
		if (state.problems?.length) this.navigateToFirstProblem(state.problems);
		this.validationNavigatorOpen = false;
		this.updateValidationNavigator();
	});
	return wrap;
}

export function updateValidationNavigator() {
	const navigator = this.validationNavigator?.querySelector?.('.validation-navigator');
	const toggle = navigator?.querySelector?.('.validation-orb');
	const jump = navigator?.querySelector?.('.validation-jump');
	const reveal = navigator?.querySelector?.('.validation-reveal');
	if (!navigator || !toggle || !jump || !reveal) return;
	const state = this.validationNavigatorState();
	navigator.dataset.state = state.state;
	navigator.dataset.open = String(this.validationNavigatorOpen);
	toggle.setAttribute('aria-expanded', String(this.validationNavigatorOpen));
	reveal.setAttribute('aria-hidden', String(!this.validationNavigatorOpen));
	jump.tabIndex = this.validationNavigatorOpen ? 0 : -1;
	toggle.setAttribute('aria-label', this.validationNavigatorOpen ? this.copy.closeAnswerNavigator : `${this.copy.openAnswerNavigator}: ${state.label}`);
	this.validationOrbValue.textContent = state.state === 'ready' ? '✓' : state.state === 'checking' ? '' : state.count > 99 ? '99+' : String(state.count);
	this.validationLabel.textContent = state.label;
	this.validationDetail.textContent = state.detail;
	jump.setAttribute('aria-label', state.problems?.length ? `${state.label}. ${state.detail}` : state.label);
	this.validationArrow.textContent = state.problems?.length ? '→' : state.state === 'ready' ? '✓' : '·';
}

export async function navigateToFirstProblem(problems = this.validationProblems()) {
	const orderedNames = this.visibleFields().map(([name]) => name);
	const named = problems.filter((problem) => problem.name);
	named.sort((a, b) => orderedNames.indexOf(a.name) - orderedNames.indexOf(b.name));
	const target = named[0];
	if (!target) {
		this.submittedAttempted = true;
		this.renderIssues(this.lastValidation?.issues || []);
		this.formError?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
		return;
	}
	this.blurred.add(target.name);
	const localIssues = this.localValidationIssues([target.name], { includeRequired: true });
	this.renderLocalIssues([target.name], localIssues);
	if (this.flowType === 'guided_assessment') this.goToGuidedQuestion(target.name);
	const field = this.fields.get(target.name);
	field?.wrap?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
	const controls = field?.controls || [field?.control];
	(controls.find((control) => control?.checked) || controls.find((control) => control && control.type !== 'hidden'))
		?.focus?.({ preventScroll: true });
}

export async function focusFirstInvalid(result = this.lastValidation) {
	const issues = (result?.issues || []).filter((issue) => issue?.severity === 'error' && issue?.field_id);
	let name = issues.find((issue) => this.fields.get(issue.field_id)?.engineVisible !== false)?.field_id;
	if (!name) {
		name = this.visibleFields().find(([fieldName, field]) =>
			field.definition?.required === true && !answerProvided(field.definition, this.values[fieldName])
		)?.[0];
	}
	if (!name) return;
	if (this.flowType === 'guided_assessment') {
		this.guidedPhase = 'questions';
		this.guidedReview.hidden = true;
		this.guidedQuestion.hidden = false;
		this.guidedPath.hidden = false;
		this.guidedIndex = Math.max(0, this.visibleFields().findIndex(([fieldName]) => fieldName === name));
		this.refreshGuided();
	}
	const field = this.fields.get(name);
	field?.wrap?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
	(field?.controls || [field?.control]).find((control) => control && control.type !== 'hidden')?.focus?.({ preventScroll: true });
}
