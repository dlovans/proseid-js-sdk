import { errorMessage } from '../../errors.js';
import { text } from '../dom.js';

export function renderFatal(error) {
	this.shadow.replaceChildren();
	this.installStyles();
	const shell = text('section', 'shell');
	const complete = text('div', 'completion-view');
	complete.append(text('div', 'seal', '!'), text('h2', '', this.copy.formUnavailable));
	complete.append(text('p', '', errorMessage(error?.code, error?.message)));
	const ledger = this.renderLedger();
	if (ledger) shell.append(ledger);
	shell.append(complete);
	this.shadow.append(shell);
}
