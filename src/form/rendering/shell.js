import { styles } from '../../styles.js';
import { text } from '../dom.js';

export function installStyles() {
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

export function renderLoading() {
	this.shadow.replaceChildren();
	this.installStyles();
	const shell = text('div', 'shell');
	const skeleton = text('div', 'skeleton');
	for (let i = 0; i < 6; i++) skeleton.append(text('div', 'skeleton-line'));
	const ledger = this.renderLedger('loading');
	if (ledger) shell.append(ledger);
	shell.append(skeleton);
	this.shadow.append(shell);
}

export function renderForm() {
	this.shadow.replaceChildren();
	this.installStyles();
	const shell = text('section', 'shell');
	shell.setAttribute('aria-label', this.manifest.flow.title);
	const head = text('header', 'head');
	const brands = text('div', 'brands');
	brands.append(this.brand(this.manifest.publisher));
	const respondentTools = text('div', 'respondent-tools');
	respondentTools.append(this.renderLanguageSelector());
	const proseidBrand = this.proseidBrand();
	if (proseidBrand) respondentTools.append(proseidBrand);
	brands.append(respondentTools);
	head.append(brands, text('h1', '', this.manifest.flow.title));
	if (this.manifest.flow.description) head.append(text('p', 'description', this.manifest.flow.description));
	const schemaDetails = this.renderSchemaDetails();
	if (schemaDetails) head.append(schemaDetails);
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
	this.submitButton = text('button', 'submit', this.options.submitLabel || this.defaultSubmitLabel());
	this.submitButton.type = 'submit';
	this.submitButton.disabled = true;
	this.validationNavigator = this.renderValidationNavigator();
	if (this.flowType === 'guided_assessment') this.formNode.append(this.renderGuided());
	else if (this.flowType === 'determination') this.formNode.append(this.renderDetermination());
	else if (this.flowType === 'checklist') this.formNode.append(this.renderChecklist());
	else this.formNode.append(this.fieldList, this.renderActions({ standardForm: true }));
	body.append(this.formError, this.formNode);
	this.progressNode = this.renderLedger();
	this.progressFill = this.progressNode?.querySelector('.ledger-fill') || null;
	if (this.progressNode) {
		this.progressNode.setAttribute('role', 'progressbar');
		this.progressNode.setAttribute('aria-label', this.copy.answerProgress);
		this.progressNode.setAttribute('aria-valuemin', '0');
		this.progressNode.setAttribute('aria-valuemax', '100');
		shell.append(this.progressNode);
	}
	shell.append(head, body);
	this.shadow.append(shell);
	this.updateAnswerProgress();
	this.updateValidationNavigator();
}
