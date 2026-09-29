import { text } from '../dom.js';

export function collectBasicSignature() {
	return new Promise((resolve) => {
		const overlay = text('div', 'signature-overlay');
		const dialog = text('section', 'signature-dialog');
		dialog.setAttribute('role', 'dialog');
		dialog.setAttribute('aria-modal', 'true');
		dialog.setAttribute('aria-labelledby', 'proseid-signature-title');
		const eyebrow = text('div', 'signature-eyebrow', this.copy.basicSignature);
		const title = text('h2', '', this.copy.signatureTitle);
		title.id = 'proseid-signature-title';
		const help = text('p', 'signature-help', this.copy.signatureHelp);
		const form = document.createElement('form');
		form.className = 'signature-form';
		form.noValidate = true;
		const nameLabel = text('label', 'signature-label', this.copy.signatureName);
		nameLabel.htmlFor = 'proseid-signature-name';
		const name = document.createElement('input');
		name.id = 'proseid-signature-name';
		name.className = 'signature-input';
		name.type = 'text';
		name.autocomplete = 'name';
		name.maxLength = 160;
		name.required = true;
		name.placeholder = this.copy.signaturePlaceholder;
		const acknowledgement = text('label', 'signature-acknowledgement');
		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.required = true;
		const acknowledgementTrack = text('span', 'signature-toggle');
		acknowledgementTrack.setAttribute('aria-hidden', 'true');
		acknowledgement.append(checkbox, acknowledgementTrack, text('span', '', this.copy.signatureAcknowledgement));
		const error = text('p', 'signature-error');
		error.setAttribute('role', 'alert');
		const actions = text('div', 'signature-actions');
		const cancel = text('button', 'signature-cancel', this.copy.cancel);
		cancel.type = 'button';
		const confirm = text('button', 'signature-confirm', this.copy.signAndSubmit);
		confirm.type = 'submit';
		actions.append(cancel, confirm);
		form.append(nameLabel, name, acknowledgement, error, actions);
		dialog.append(eyebrow, title, help, form);
		overlay.append(dialog);

		let settled = false;
		const finish = (value) => {
			if (settled) return;
			settled = true;
			this.signatureCancel = null;
			overlay.remove();
			resolve(value);
		};
		this.signatureCancel = () => finish(null);
		cancel.addEventListener('click', () => finish(null));
		overlay.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') finish(null);
		});
		form.addEventListener('submit', (event) => {
			event.preventDefault();
			const typedName = name.value.trim();
			if (typedName.length < 2 || !checkbox.checked) {
				error.textContent = typedName.length < 2 ? this.copy.signatureNameError : this.copy.signatureAcknowledgementError;
				if (typedName.length < 2) name.focus();
				else checkbox.focus();
				return;
			}
			finish({ kind: 'basic', typed_name: typedName, acknowledged: true });
		});
		this.shadow.append(overlay);
		name.focus();
	});
}
