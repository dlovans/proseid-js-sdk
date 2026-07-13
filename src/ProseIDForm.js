import { EmbedApi } from './api.js';
import { ProseIDError, errorMessage } from './errors.js';
import { SigningCoordinator } from './signing.js';
import { styles } from './styles.js';
import { messagesFor } from './i18n.js';
import { normalizeAppearance, normalizeAttribution, safeLogoUrl } from './presentation.js';
import { normalizeTheme, THEMES } from './themes.js';

const text = (tag, className, value = '') => {
	const node = document.createElement(tag);
	if (className) node.className = className;
	node.textContent = value;
	return node;
};

const friendlyIssue = (issue, label, copy) => {
	switch (issue?.kind) {
		case 'missing_required': return copy.required(label);
		case 'attestation_incomplete': return copy.confirm;
		case 'type_mismatch': return copy.format(label);
		case 'constraint_violation':
			if (/pattern/i.test(issue.message || '')) return copy.validValue;
			if (/too short|minimum .* character/i.test(issue.message || '')) return copy.tooShort;
			if (/too long|maximum .* character/i.test(issue.message || '')) return copy.tooLong;
			return issue.message || copy.checkValue;
		default: return issue?.message || copy.checkValue;
	}
};

const randomSessionId = () => `embed_${globalThis.crypto?.randomUUID?.().replaceAll('-', '') || Math.random().toString(36).slice(2).padEnd(16, '0')}`;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export class ProseIDForm {
	constructor(target, options) {
		this.target = typeof target === 'string' ? document.querySelector(target) : target;
		if (!(this.target instanceof Element)) throw new ProseIDError('invalid_target', 'Choose an element to contain the ProseID form.');
		if (!options?.form && !options?.testMode) throw new ProseIDError('invalid_form', 'The form coordinate is required.');
		if (!options?.apiKey) throw new ProseIDError('invalid_api_key', 'A ProseID publishable key is required.');
		this.options = options;
		this.copy = messagesFor(options.locale, options.messages);
		this.attribution = normalizeAttribution(options.branding?.proseid);
		this.api = new EmbedApi({
			apiBase: options.apiBase,
			apiKey: options.apiKey,
			form: options.form,
			testMode: options.testMode === true,
			attribution: this.attribution,
			fetchImpl: options.fetch
		});
		this.signing = new SigningCoordinator(options.signingAdapter);
		this.shadow = this.target.shadowRoot || this.target.attachShadow({ mode: 'open' });
		this.values = {};
		this.fields = new Map();
		this.blurred = new Set();
		this.submittedAttempted = false;
		this.valid = false;
		this.destroyed = false;
		this.validationTimer = null;
		this.validationAbort = null;
		this.sessionId = randomSessionId();
		this.applyAppearance(options.appearance);
		this.applyTheme(options.theme);
		this.renderLoading();
		this.ready = this.load();
	}

	applyTheme(theme = {}) {
		const name = normalizeTheme(theme);
		this.target.dataset.proseidTheme = name;
		for (const [key, value] of Object.entries(THEMES[name])) {
			const token = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
			this.target.style.setProperty(`--proseid-${token}`, value);
		}
	}

	applyAppearance(appearance) {
		const value = normalizeAppearance(appearance);
		this.target.dataset.proseidShape = value.shape;
		this.target.dataset.proseidFields = value.fields;
		this.target.dataset.proseidShell = value.shell;
		this.target.dataset.proseidDensity = value.density;
	}

	installStyles() {
		if ('adoptedStyleSheets' in this.shadow && typeof CSSStyleSheet !== 'undefined' && CSSStyleSheet.prototype.replaceSync) {
			const sheet = new CSSStyleSheet();
			sheet.replaceSync(styles);
			this.shadow.adoptedStyleSheets = [sheet];
		} else {
			const style = document.createElement('style');
			if (this.options.nonce) style.setAttribute('nonce', this.options.nonce);
			style.textContent = styles;
			this.shadow.append(style);
		}
	}

	renderLoading() {
		this.shadow.replaceChildren();
		this.installStyles();
		const shell = text('div', 'shell');
		const skeleton = text('div', 'skeleton');
		for (let i = 0; i < 6; i++) skeleton.append(text('div', 'skeleton-line'));
		shell.append(text('div', 'ledger'), skeleton);
		this.shadow.append(shell);
	}

	async load() {
		try {
			this.manifest = await this.api.manifest();
			if (this.destroyed) return this;
			this.attribution = normalizeAttribution(this.manifest.presentation?.attribution ?? this.attribution);
			this.api.setAttribution(this.attribution);
			if (this.manifest.capabilities?.signing?.requested && !this.manifest.capabilities.signing.available) {
				throw new ProseIDError('signing_not_available', 'Signing is not available in embedded forms yet.');
			}
			this.seedValues();
			this.renderForm();
			this.emit('ready', { manifest: this.manifest });
			await this.validate();
			return this;
		} catch (error) {
			this.renderFatal(error);
			this.emit('error', { error });
			throw error;
		}
	}

	seedValues() {
		for (const [name, definition] of Object.entries(this.manifest.schema?.definitions || {})) {
			this.values[name] = definition?.value ?? (['boolean', 'attestation'].includes(definition?.type) ? false : '');
		}
	}

	brand(publisher) {
		const wrap = text('div', 'brand');
		const customLogo = safeLogoUrl(this.options.branding?.logoUrl);
		const logo = customLogo || safeLogoUrl(publisher.logo);
		if (logo) {
			const img = document.createElement('img');
			img.src = logo;
			img.alt = this.options.branding?.logoAlt || `${publisher.name} logo`;
			wrap.append(img);
		} else {
			wrap.append(text('span', 'brand-fallback', publisher.name.slice(0, 2).toUpperCase()));
		}
		const copy = text('div', 'brand-copy');
		copy.append(text('div', 'brand-name', publisher.name));
		copy.append(text('div', `brand-note${publisher.verified ? ' verified' : ''}`, publisher.verified ? this.copy.verifiedPublisher : `@${publisher.slug}`));
		wrap.append(copy);
		return wrap;
	}

	proseidBrand() {
		if (this.attribution === 'hidden') return null;
		const brand = this.manifest.branding.proseid;
		const link = text('a', `proseid-brand${this.attribution === 'compact' ? ' compact' : ''}`);
		link.href = brand.url;
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		link.setAttribute('aria-label', `${this.copy.verifiedBy} ProseID`);
		const img = document.createElement('img');
		img.src = brand.logo;
		img.alt = 'ProseID';
		if (this.attribution === 'full') link.append(text('span', '', this.copy.verifiedBy));
		link.append(img);
		return link;
	}

	renderForm() {
		this.shadow.replaceChildren();
		this.installStyles();
		const shell = text('section', 'shell');
		shell.setAttribute('aria-label', this.manifest.form.title);
		const head = text('header', 'head');
		const brands = text('div', 'brands');
		brands.append(this.brand(this.manifest.publisher));
		const proseidBrand = this.proseidBrand();
		if (proseidBrand) brands.append(proseidBrand);
		else brands.classList.add('publisher-only');
		head.append(brands, text('h1', '', this.manifest.form.title));
		if (this.manifest.form.description) head.append(text('p', 'description', this.manifest.form.description));
		this.statusNode = text('div', 'status');
		this.statusNode.dataset.state = 'idle';
		this.statusNode.append(text('span', 'status-dot'), text('span', 'status-copy', this.copy.idle));
		head.append(this.statusNode);

		const body = text('div', 'body');
		this.formError = text('div', 'form-error');
		this.formError.hidden = true;
		this.formNode = document.createElement('form');
		this.formNode.noValidate = true;
		this.formNode.addEventListener('submit', (event) => this.submit(event));
		this.fieldList = text('div', 'fields');
		for (const [name, definition] of Object.entries(this.manifest.schema?.definitions || {})) {
			if (definition?.readonly === true) continue;
			this.fieldList.append(this.renderField(name, definition));
		}
		this.formNode.append(this.fieldList);

		const actions = text('div', 'actions');
		const privacy = text('div', 'privacy');
		privacy.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
		privacy.append(text('span', '', this.attribution === 'hidden' ? this.copy.privacyWhiteLabel : this.copy.privacy));
		this.submitButton = text('button', 'submit', this.options.submitLabel || this.copy.submit);
		this.submitButton.type = 'submit';
		this.submitButton.disabled = true;
		actions.append(privacy, this.submitButton);
		this.formNode.append(actions);
		body.append(this.formError, this.formNode);
		shell.append(text('div', 'ledger'), head, body);
		this.shadow.append(shell);
	}

	renderField(name, definition) {
		const wrap = text('div', 'field');
		wrap.hidden = definition.visible === false;
		const labelText = definition.label || name.replaceAll('_', ' ');
		const id = `proseid-${name.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
		let control;

		if (['boolean', 'attestation'].includes(definition.type)) {
			const label = text('label', 'check');
			control = document.createElement('input');
			control.type = 'checkbox';
			control.checked = Boolean(this.values[name]);
			const copy = text('span', 'check-copy', definition.statement || labelText);
			label.append(control, copy);
			wrap.append(label);
		} else {
			const label = text('label', 'label', labelText);
			label.htmlFor = id;
			if (definition.required) label.append(text('span', 'required', ' *'));
			wrap.append(label);
			if (definition.type === 'select') {
				control = document.createElement('select');
				const empty = text('option', '', this.copy.select);
				empty.value = '';
				control.append(empty);
				for (const option of definition.options || []) {
					const value = typeof option === 'object' ? option.value : option;
					const item = text('option', '', typeof option === 'object' ? (option.label || value) : value);
					item.value = value;
					control.append(item);
				}
			} else if (definition.multiline) {
				control = document.createElement('textarea');
			} else {
				control = document.createElement('input');
				control.type = ['number', 'currency'].includes(definition.type) ? 'number' : definition.type === 'date' ? 'date' : definition.format === 'email' ? 'email' : 'text';
				if (definition.type === 'currency') control.step = '0.01';
			}
			control.id = id;
			control.className = 'control';
			control.value = this.values[name] ?? '';
			if (definition.placeholder) control.placeholder = definition.placeholder;
			if (definition.min != null) control.min = definition.min;
			if (definition.max != null) control.max = definition.max;
			wrap.append(control);
			if (definition.description || definition.help) wrap.append(text('span', 'hint', definition.description || definition.help));
		}

		control.name = name;
		control.setAttribute('aria-describedby', `${id}-error`);
		control.addEventListener('input', () => this.change(name, definition, control));
		control.addEventListener('change', () => this.change(name, definition, control, true));
		control.addEventListener('blur', () => {
			this.blurred.add(name);
			this.renderIssues(this.lastValidation?.issues || []);
			this.scheduleValidation(0);
		});
		const error = text('span', 'error');
		error.id = `${id}-error`;
		error.setAttribute('aria-live', 'polite');
		wrap.append(error);
		this.fields.set(name, { wrap, control, error, definition, label: labelText });
		return wrap;
	}

	change(name, definition, control, immediate = false) {
		const value = ['boolean', 'attestation'].includes(definition.type)
			? control.checked
			: ['number', 'currency'].includes(definition.type) && control.value !== ''
				? Number(control.value)
				: control.value;
		// Browsers fire `change` again when a filled control loses focus. Do not invalidate a value
		// that the server has already approved: doing so can disable Submit between pointer-down and
		// click when the user moves directly from the last field to the button.
		if (Object.is(this.values[name], value)) return;
		this.values[name] = value;
		this.valid = false;
		this.submitButton.disabled = true;
		this.setStatus('checking', this.copy.checking);
		this.emit('change', { name, value: this.values[name], values: { ...this.values } });
		this.scheduleValidation(immediate ? 0 : (this.options.validateDelay ?? 400));
	}

	scheduleValidation(delay) {
		clearTimeout(this.validationTimer);
		this.validationTimer = setTimeout(() => this.validate(), Math.max(0, delay));
	}

	async validate() {
		if (this.destroyed || !this.manifest) return null;
		this.validationAbort?.abort();
		this.validationAbort = new AbortController();
		this.setStatus('checking', this.copy.checking);
		try {
			const result = await this.api.validate(this.manifest.form.ref, this.values, this.validationAbort.signal);
			this.lastValidation = result;
			this.valid = result.valid === true;
			this.applyDefinitions(result.definitions || {});
			this.renderIssues(result.issues || []);
			this.submitButton.disabled = !this.valid;
			this.setStatus(this.valid ? 'ready' : 'idle', this.valid ? this.copy.ready : this.copy.incomplete);
			this.emit('validation', { valid: this.valid, status: result.status, issues: result.issues || [] });
			return result;
		} catch (error) {
			if (error?.name === 'AbortError') return null;
			this.valid = false;
			this.submitButton.disabled = true;
			this.setStatus('error', this.copy.checkFailed);
			this.emit('error', { error });
			return null;
		}
	}

	applyDefinitions(definitions) {
		for (const [name, resolved] of Object.entries(definitions)) {
			const field = this.fields.get(name);
			if (!field) continue;
			field.wrap.hidden = resolved?.visible === false;
		}
	}

	shouldShow(issue) {
		if (this.submittedAttempted) return true;
		if (issue?.trigger === 'completion') return false;
		if (issue?.trigger === 'correction') return this.blurred.has(issue.field_id);
		return issue?.severity === 'warning' || issue?.severity === 'notice';
	}

	renderIssues(issues) {
		for (const field of this.fields.values()) {
			field.error.textContent = '';
			field.control.setAttribute('aria-invalid', 'false');
		}
		const formIssues = [];
		for (const issue of issues) {
			if (!this.shouldShow(issue)) continue;
			const field = this.fields.get(issue.field_id);
			if (field) {
				field.error.textContent = friendlyIssue(issue, field.label, this.copy);
				field.control.setAttribute('aria-invalid', 'true');
			} else formIssues.push(friendlyIssue(issue, 'This field', this.copy));
		}
		this.formError.textContent = formIssues.join(' ');
		this.formError.hidden = formIssues.length === 0;
	}

	setStatus(state, copy) {
		if (!this.statusNode) return;
		this.statusNode.dataset.state = state;
		this.statusNode.querySelector('.status-copy').textContent = copy;
	}

	async submit(event) {
		event.preventDefault();
		if (this.destroyed) return;
		this.submittedAttempted = true;
		this.renderIssues(this.lastValidation?.issues || []);
		if (!this.valid) {
			await this.validate();
			if (!this.valid) return;
		}
		this.submitButton.disabled = true;
		this.submitButton.textContent = this.copy.submitting;
		this.setStatus('checking', this.copy.creating);
		this.emit('submit', { values: { ...this.values } });
		try {
			let signature = null;
			if (this.manifest.capabilities?.signing?.requested) {
				const nextAction = await this.api.prepareSigning(this.manifest.form.ref, this.sessionId, this.values);
				signature = await this.signing.handle(nextAction, { manifest: this.manifest, values: { ...this.values } });
				this.emit('signing', { nextAction, signature });
			}
			const result = await this.api.complete(this.manifest.form.ref, this.sessionId, this.values, signature);
			this.renderComplete(result);
			this.emit('complete', result);
		} catch (error) {
			this.submitButton.disabled = !this.valid;
			this.submitButton.textContent = this.options.submitLabel || this.copy.submit;
			this.formError.hidden = false;
			this.formError.textContent = errorMessage(error.code, error.message);
			this.setStatus('error', 'Submission not saved');
			this.emit('error', { error });
		}
	}

	renderComplete(result) {
		const shell = this.shadow.querySelector('.shell');
		const complete = text('div', 'complete');
		complete.append(text('div', 'seal', '✓'), text('h2', '', result.test ? this.copy.testCompleteTitle : this.copy.completeTitle));
		complete.append(text('p', '', result.test ? this.copy.testDelivered : this.copy.delivered(this.manifest.publisher.name)));
		complete.append(text('div', 'receipt', result.test ? this.copy.testRecord(result.sessionId) : this.copy.auditRecord(result.sessionId)));
		if (result.test) {
			complete.append(text('p', 'receipt-test', this.copy.receiptTest));
		} else if (this.manifest.capabilities?.receiptEmail !== false) {
			complete.append(this.renderReceiptEmail(result));
		}
		shell.replaceChildren(text('div', 'ledger'), complete);
	}

	renderReceiptEmail(result) {
		const section = text('section', 'receipt-copy');
		const title = text('h3', '', this.copy.receiptTitle);
		const help = text('p', 'receipt-help', this.copy.receiptHelp);
		const form = document.createElement('form');
		form.className = 'receipt-form';
		form.noValidate = true;
		const field = text('div', 'receipt-field');
		const id = `proseid-receipt-${String(result.sessionId).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48)}`;
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

	async sendReceipt(event, { result, input, button, status }) {
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
		button.textContent = this.copy.receiptSending;
		status.dataset.state = 'idle';
		status.textContent = '';
		try {
			await this.api.emailReceipt(this.manifest.form.ref, result.sessionId, email);
			status.dataset.state = 'sent';
			status.textContent = this.copy.receiptSent(email);
			button.textContent = this.copy.receiptAction;
			this.emit('receipt', { status: 'sent', sessionId: result.sessionId, email });
		} catch (error) {
			input.disabled = false;
			button.disabled = false;
			button.textContent = this.copy.receiptAction;
			status.dataset.state = 'error';
			status.textContent = error?.code === 'rate_limited' ? this.copy.receiptRateLimited : this.copy.receiptError;
			this.emit('receipt', { status: 'error', sessionId: result.sessionId, email, error });
		}
	}

	renderFatal(error) {
		this.shadow.replaceChildren();
		this.installStyles();
		const shell = text('section', 'shell');
		const complete = text('div', 'complete');
		complete.append(text('div', 'seal', '!'), text('h2', '', this.copy.formUnavailable));
		complete.append(text('p', '', errorMessage(error?.code, error?.message)));
		shell.append(text('div', 'ledger'), complete);
		this.shadow.append(shell);
	}

	emit(name, detail) {
		this.target.dispatchEvent(new CustomEvent(`proseid:${name}`, { detail, bubbles: true, composed: true }));
		const callback = this.options[`on${name[0].toUpperCase()}${name.slice(1)}`];
		if (typeof callback === 'function') callback(name === 'error' ? detail.error : detail);
	}

	destroy() {
		this.destroyed = true;
		clearTimeout(this.validationTimer);
		this.validationAbort?.abort();
		this.shadow.replaceChildren();
		this.fields.clear();
	}
}
