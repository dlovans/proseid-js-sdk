import { text } from '../dom.js';
import { humanizeText, humanizeChoice } from '../labels.js';

export function renderField(name, definition) {
	const wrap = text('div', 'field');
	wrap.dataset.fieldName = name;
	if (['highlight', 'error', 'warning', 'success', 'muted'].includes(definition.ui_class)) wrap.classList.add(definition.ui_class);
	wrap.hidden = definition.visible === false;
	const labelText = humanizeText(definition.label || definition.statement || name);
	const id = `proseid-${this.recordId.slice(-10)}-${name.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
	let control;
	let controls = [];

	const required = text('span', 'required', this.copy.requiredLabel);
	required.hidden = definition.required !== true;
	const infoId = `${id}-info`;
	const messageId = `${id}-message`;
	const hintId = `${id}-hint`;
	let info = null;
	if (definition.info) {
		info = text('span', 'info-tip');
		const trigger = text('button', 'info-trigger', 'i');
		trigger.type = 'button';
		trigger.setAttribute('aria-label', this.copy.moreInformation(labelText));
		trigger.setAttribute('aria-describedby', infoId);
		const popover = text('span', 'info-popover', definition.info);
		popover.id = infoId;
		popover.setAttribute('role', 'tooltip');
		info.append(trigger, popover);
	}

	if (this.flowType === 'checklist' && definition.type === 'boolean') {
		control = document.createElement('input');
		control.type = 'hidden';
		control.value = this.values[name] === undefined ? '' : String(this.values[name]);
		controls = [control];
		const row = text('div', 'checklist-boolean');
		const copy = text('div', 'checklist-boolean-copy');
		const label = text('span', 'label', definition.statement || labelText);
		label.id = `${id}-label`;
		copy.append(label, required);
		if (info) copy.append(info);
		const choices = text('div', 'boolean-choice');
		choices.setAttribute('role', 'group');
		choices.setAttribute('aria-labelledby', label.id);
		const yes = text('button', '', this.copy.yes);
		const no = text('button', '', this.copy.no);
		yes.type = no.type = 'button';
		yes.setAttribute('aria-pressed', 'false');
		no.setAttribute('aria-pressed', 'false');
		yes.addEventListener('click', () => this.setChecklistBoolean(name, true));
		no.addEventListener('click', () => this.setChecklistBoolean(name, false));
		choices.append(yes, no);
		row.append(copy, choices);
		wrap.append(row);
		wrap.choiceButtons = { yes, no };
	} else if (definition.type === 'boolean') {
		const group = document.createElement('fieldset');
		group.className = 'boolean-field';
		const legend = text('legend', 'sr-only', labelText);
		const row = text('div', 'boolean-row');
		const copy = text('div', 'boolean-copy', labelText);
		copy.append(required);
		if (info) copy.append(info);
		const choices = text('div', 'boolean-choice');
		choices.setAttribute('role', 'radiogroup');
		const yesLabel = document.createElement('label');
		const noLabel = document.createElement('label');
		const yes = document.createElement('input');
		const no = document.createElement('input');
		yes.type = no.type = 'radio';
		yes.name = no.name = name;
		yes.value = 'true';
		no.value = 'false';
		yes.checked = this.values[name] === true;
		no.checked = this.values[name] === false;
		yesLabel.classList.toggle('selected', yes.checked);
		noLabel.classList.toggle('selected', no.checked);
		yesLabel.append(yes, text('span', '', this.copy.yes));
		noLabel.append(no, text('span', '', this.copy.no));
		choices.append(yesLabel, noLabel);
		row.append(copy, choices);
		group.append(legend, row);
		wrap.append(group);
		control = yes;
		controls = [yes, no];
		wrap.choiceLabels = { yes: yesLabel, no: noLabel };
	} else if (definition.type === 'attestation') {
		const label = text('label', 'check');
		control = document.createElement('input');
		control.type = 'checkbox';
		control.checked = this.values[name] === true;
		control.setAttribute('role', 'switch');
		controls = [control];
		const track = text('span', 'toggle-track');
		track.setAttribute('aria-hidden', 'true');
		const copy = text('span', 'check-copy', definition.statement || labelText);
		copy.append(required);
		label.append(control, track, copy);
		const row = text('div', 'check-row');
		row.append(label);
		if (info) row.append(info);
		wrap.append(row);
	} else {
		const label = text('label', 'label', labelText);
		label.htmlFor = id;
		label.append(required);
		const row = text('div', 'label-row');
		row.append(label);
		if (info) row.append(info);
		wrap.append(row);
		if (definition.type === 'select') {
			control = document.createElement('select');
			const empty = text('option', '', definition.placeholder || this.copy.select);
			empty.value = '';
			empty.disabled = true;
			control.append(empty);
			for (const option of definition.options || []) {
				const value = typeof option === 'object' ? option.value : option;
				const item = text('option', '', humanizeChoice(typeof option === 'object' ? (option.label || value) : value));
				item.value = value;
				control.append(item);
			}
		} else if (definition.type === 'date') {
			const datePicker = this.renderDatePicker(id, definition, labelText);
			control = datePicker.input;
			wrap.append(datePicker.wrap);
		} else if (definition.multiline) {
			control = document.createElement('textarea');
			control.rows = 5;
		} else {
			control = document.createElement('input');
			control.type = ['number', 'currency'].includes(definition.type) ? 'number' : definition.format === 'email' ? 'email' : 'text';
			if (definition.step != null) control.step = definition.step;
			else if (definition.type === 'currency') control.step = '0.01';
		}
		controls = [control];
		control.id = id;
		control.className = definition.type === 'date' ? 'control date-input' : 'control';
		control.value = this.values[name] ?? '';
		if (definition.placeholder && definition.type !== 'select') control.placeholder = definition.placeholder;
		if (definition.min != null) control.min = definition.min;
		if (definition.max != null) control.max = definition.max;
		if (definition.min_length != null) control.minLength = definition.min_length;
		if (definition.max_length != null) control.maxLength = definition.max_length;
		if (definition.pattern) control.pattern = definition.pattern;
		if (definition.type !== 'date') wrap.append(control);
		if (definition.description || definition.help) {
			const hint = text('span', 'hint', definition.description || definition.help);
			hint.id = hintId;
			wrap.append(hint);
		}
	}

	for (const item of controls) {
		item.name = name;
		item.required = definition.required === true;
	}
	const message = text('span', 'field-message', definition.ui_message || '');
	message.id = messageId;
	message.hidden = !definition.ui_message;
	wrap.append(message);
	const describedBy = [definition.info ? infoId : '', definition.description || definition.help ? hintId : '', messageId, `${id}-error`].filter(Boolean);
	for (const item of controls) {
		item.setAttribute('aria-describedby', describedBy.join(' '));
		item.addEventListener('input', () => this.change(name, definition, item));
		item.addEventListener('change', () => this.change(name, definition, item, true));
		item.addEventListener('blur', () => {
			this.blurred.add(name);
			this.scheduleValidation(120, [name], { includeRequired: true });
		});
	}
	const error = text('span', 'error');
	error.id = `${id}-error`;
	error.setAttribute('aria-live', 'polite');
	wrap.append(error);
	this.fields.set(name, {
		wrap, control, controls, error, message, required, definition, label: labelText,
		engineVisible: definition.visible !== false,
		choiceButtons: wrap.choiceButtons || null,
		choiceLabels: wrap.choiceLabels || null
	});
	return wrap;
}
