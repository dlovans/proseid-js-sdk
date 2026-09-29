import { text } from '../dom.js';

export function renderChecklist() {
	const checklist = text('div', 'checklist');
	const head = text('header', 'checklist-head');
	const copy = text('div', 'checklist-title');
	copy.append(text('span', 'eyebrow', this.copy.checklistEyebrow), text('h2', '', this.copy.checklistTitle), text('p', '', this.copy.checklistHelp));
	this.checklistProgress = text('div', 'checklist-progress');
	head.append(copy);
	const context = text('section', 'checklist-section');
	const controls = text('section', 'checklist-section checklist-controls');
	const contextFields = [];
	const controlFields = [];
	for (const [, field] of this.fields) {
		if (['boolean', 'attestation'].includes(field.definition.type)) controlFields.push(field.wrap);
		else contextFields.push(field.wrap);
	}
	if (contextFields.length) {
		const contextHead = text('header', 'checklist-section-head');
		contextHead.append(text('span', 'eyebrow', this.copy.checklistContext), text('h3', '', this.copy.checklistContextTitle), text('p', '', this.copy.checklistContextHelp));
		context.append(contextHead);
		const grid = text('div', 'checklist-context-grid');
		grid.append(...contextFields);
		context.append(grid);
	}
	const controlsHead = text('header', 'checklist-section-head');
	controlsHead.append(text('span', 'eyebrow', this.copy.checklistControlsLabel), text('h3', '', this.copy.checklistControls), text('p', '', this.copy.checklistControlsHelp));
	controls.append(controlsHead);
	const list = text('div', 'checklist-control-list');
	list.append(...controlFields);
	controls.append(list);
	checklist.append(head);
	if (contextFields.length) checklist.append(context);
	const completion = this.renderActions();
	completion.classList.add('checklist-completion');
	completion.prepend(this.checklistProgress);
	checklist.append(controls, completion);
	this.updateChecklistProgress();
	return checklist;
}

export function checklistControlNames() {
	return [...this.fields.entries()]
		.filter(([, field]) => field.engineVisible !== false && ['boolean', 'attestation'].includes(field.definition.type))
		.map(([name]) => name);
}

export function updateChecklistProgress() {
	if (!this.checklistProgress) return;
	const names = this.checklistControlNames();
	const reviewed = names.filter((name) => this.reviewed.has(name)).length;
	this.checklistProgress.replaceChildren(
		text('strong', '', `${reviewed}/${names.length}`),
		text('span', '', this.copy.checklistProgress(reviewed, names.length))
	);
	if (this.progressEnabled()) {
		const rail = text('div', 'checklist-progress-rail');
		const fill = text('i', '');
		fill.style.width = `${names.length ? Math.round((reviewed / names.length) * 100) : 100}%`;
		rail.append(fill);
		this.checklistProgress.append(rail);
	}
}

export function setChecklistBoolean(name, value) {
	const field = this.fields.get(name);
	if (!field) return;
	const firstReview = !this.reviewed.has(name);
	this.reviewed.add(name);
	field.control.value = String(value);
	field.choiceButtons?.yes.classList.toggle('selected', value === true);
	field.choiceButtons?.no.classList.toggle('selected', value === false);
	field.choiceButtons?.yes.setAttribute('aria-pressed', String(value === true));
	field.choiceButtons?.no.setAttribute('aria-pressed', String(value === false));
	this.clearStaleFieldEvaluation(name);
	this.updateChecklistProgress();
	if (Object.is(this.values[name], value)) {
		this.updateSubmitState();
		if (firstReview) {
			this.emit('change', { name, value, values: { ...this.values } });
			this.scheduleValidation(0, [name]);
		}
		return;
	}
	this.values[name] = value;
	this.updateAnswerProgress();
	this.valid = false;
	this.updateSubmitState();
	this.setStatus('checking', this.copy.checking);
	this.emit('change', { name, value, values: { ...this.values } });
	this.invalidateStaleValidationRequest();
	this.scheduleValidation(0, [name]);
}
