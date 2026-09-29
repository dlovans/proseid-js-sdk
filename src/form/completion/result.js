import { text } from '../dom.js';
import { humanizeText } from '../labels.js';

export function renderComplete(result) {
	for (const cleanup of this.cleanupFns.splice(0)) cleanup();
	const shell = this.shadow.querySelector('.shell');
	const complete = text('div', 'completion-view');
	const summary = text('header', 'completion-summary');
	const summaryCopy = text('div', 'completion-summary-copy');
	summaryCopy.append(
		text('h2', '', result.test ? this.copy.testCompleteTitle : this.copy.completeTitle),
		text('p', '', result.test ? this.copy.testDelivered : this.copy.delivered(this.manifest.publisher.name)),
		text('div', 'receipt', result.test ? this.copy.testRecord(result.recordId) : this.copy.auditRecord(result.recordId))
	);
	summary.append(text('div', 'seal', '✓'), summaryCopy);
	complete.append(summary);
	const recordedResult = this.renderRecordedResult(result.result);
	if (recordedResult) complete.append(recordedResult);
	if (result.test) {
		complete.append(text('p', 'receipt-test', this.copy.receiptTest));
	} else if (this.manifest.capabilities?.receiptEmail !== false) {
		complete.append(this.renderReceiptEmail(result));
	}
	const ledger = this.renderLedger('complete');
	shell.replaceChildren(...(ledger ? [ledger, complete] : [complete]));
	if (this.options.autoFocusCompletion !== false) {
		requestAnimationFrame(() => {
			if (this.destroyed) return;
			const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
			this.target.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
		});
	}
}

export function renderRecordedResult(result) {
	const outcomes = Array.isArray(result?.outcomes) ? result.outcomes : [];
	const notices = Array.isArray(result?.notices) ? result.notices : [];
	if (!outcomes.length && !notices.length) return null;
	const section = text('section', 'recorded-result');
	const title = this.flowType === 'determination'
		? this.copy.resultDetermination
		: this.flowType === 'guided_assessment'
			? this.copy.resultAssessment
			: this.flowType === 'checklist'
				? this.copy.resultChecklist
				: this.copy.resultForm;
	const head = text('header', 'recorded-result-head');
	head.append(text('span', 'eyebrow', this.copy.resultEyebrow), text('h3', '', title), text('p', '', this.copy.resultHelp));
	section.append(head);
	if (outcomes.length) {
		const list = text('div', 'recorded-outcomes');
		for (const outcome of outcomes) {
			if (!outcome || !String(outcome.fieldId || '').trim()) continue;
			const item = text('article', 'recorded-outcome');
			item.append(
				text('small', '', humanizeText(outcome.label || outcome.fieldId)),
				text('strong', '', this.displayValue(outcome.value, { type: outcome.type }))
			);
			if (outcome.message) item.append(text('p', '', String(outcome.message)));
			list.append(item);
		}
		if (list.childElementCount) section.append(list);
	}
	if (notices.length) {
		const notes = text('div', 'recorded-notices');
		notes.append(text('span', 'eyebrow', this.copy.resultNotes));
		const list = document.createElement('ul');
		for (const notice of notices) if (notice?.message) list.append(text('li', '', String(notice.message)));
		if (list.childElementCount) notes.append(list);
		section.append(notes);
	}
	return section;
}
