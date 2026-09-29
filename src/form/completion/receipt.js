import { text } from '../dom.js';
import { EMAIL_RE } from '../input-patterns.js';

export function renderReceiptEmail(result) {
	const section = text('section', 'receipt-copy');
	const title = text('h3', '', this.copy.receiptTitle);
	const help = text('p', 'receipt-help', this.copy.receiptHelp);
	const form = document.createElement('form');
	form.className = 'receipt-form';
	form.noValidate = true;
	const field = text('div', 'receipt-field');
	const id = `proseid-receipt-${String(result.recordId).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48)}`;
	const label = text('label', 'receipt-label', this.copy.receiptLabel);
	label.htmlFor = id;
	const row = text('div', 'receipt-row');
	const input = document.createElement('input');
	input.id = id;
	input.className = 'receipt-input';
	input.type = 'email';
	input.inputMode = 'email';
	input.autocomplete = 'email';
	input.placeholder = this.copy.receiptPlaceholder;
	input.maxLength = 320;
	input.required = true;
	const button = text('button', 'receipt-button', this.copy.receiptAction);
	button.type = 'submit';
	button.disabled = true;
	const status = text('p', 'receipt-status');
	status.setAttribute('role', 'status');
	status.setAttribute('aria-live', 'polite');
	input.setAttribute('aria-describedby', `${id}-status`);
	status.id = `${id}-status`;
	input.addEventListener('input', () => {
		button.disabled = !EMAIL_RE.test(input.value.trim());
		input.setAttribute('aria-invalid', 'false');
		status.textContent = '';
		status.dataset.state = 'idle';
	});
	form.addEventListener('submit', (event) => this.sendReceipt(event, { result, input, button, status }));
	row.append(input, button);
	field.append(label, row, status);
	form.append(field);
	section.append(title, help, form);
	return section;
}

export async function sendReceipt(event, { result, input, button, status }) {
	event.preventDefault();
	if (this.destroyed || result.test) return;
	const email = input.value.trim();
	if (!EMAIL_RE.test(email)) {
		input.setAttribute('aria-invalid', 'true');
		status.dataset.state = 'error';
		status.textContent = this.copy.receiptInvalid;
		return;
	}

	input.disabled = true;
	button.disabled = true;
	this.setButtonBusy(button, true, this.copy.receiptSending);
	status.dataset.state = 'idle';
	status.textContent = '';
	try {
		await this.api.emailReceipt(this.manifest.flow.ref, result.recordId, email);
		status.dataset.state = 'sent';
		status.textContent = this.copy.receiptSent(email);
		this.setButtonBusy(button, false, this.copy.receiptAction);
		this.emit('receipt', { status: 'sent', recordId: result.recordId, email });
	} catch (error) {
		input.disabled = false;
		button.disabled = false;
		this.setButtonBusy(button, false, this.copy.receiptAction);
		status.dataset.state = 'error';
		status.textContent = error?.code === 'rate_limited' ? this.copy.receiptRateLimited : this.copy.receiptError;
		this.emit('receipt', { status: 'error', recordId: result.recordId, email, error });
	}
}
