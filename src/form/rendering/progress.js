import { isEmptyValue, answerProvided } from '../validation/local-constraints.js';
import { text } from '../dom.js';
import { humanizeChoice } from '../labels.js';

export function progressEnabled() {
	return this.options.showProgress !== false;
}

export function renderLedger(className = '') {
	if (!this.progressEnabled()) return null;
	const ledger = text('div', `ledger${className ? ` ${className}` : ''}`);
	ledger.append(text('span', 'ledger-fill'));
	return ledger;
}

export function visibleFields() {
	return [...this.fields.entries()].filter(([, field]) => field.engineVisible !== false);
}

export function updateAnswerProgress() {
	if (!this.progressNode || !this.progressFill) return;
	const fields = this.visibleFields();
	const answered = fields.filter(([name, field]) => answerProvided(field.definition, this.values[name])).length;
	const percent = fields.length ? Math.round((answered / fields.length) * 100) : 100;
	this.progressFill.style.width = `${percent}%`;
	this.progressNode.setAttribute('aria-valuenow', String(percent));
	this.progressNode.setAttribute('aria-valuetext', `${answered} of ${fields.length}`);
}

export function displayValue(value, definition) {
	if (isEmptyValue(definition, value)) return this.copy.notAnswered;
	if (['boolean', 'attestation'].includes(definition?.type)) return value === true ? this.copy.yes : this.copy.no;
	if (typeof value === 'object') return JSON.stringify(value);
	return humanizeChoice(value);
}
