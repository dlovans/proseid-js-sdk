import { errorMessage } from '../../errors.js';
import { normalizedResponses } from '../validation/request.js';

export async function submit(event) {
	event.preventDefault();
	if (this.destroyed || this.submitting) return;
	clearTimeout(this.validationTimer);
	this.validationScheduled = false;
	this.submittedAttempted = true;
	const localIssues = this.localValidationIssues(null, { includeRequired: true });
	if (localIssues.some((issue) => issue.severity === 'error')) {
		const { fingerprint } = this.validationRequest();
		const currentServerIssues =
			this.lastValidationFingerprint === fingerprint ? this.lastValidation?.issues || [] : [];
		this.renderIssues([...currentServerIssues, ...localIssues]);
		this.validationNavigatorOpen = true;
		this.updateValidationNavigator();
		await this.navigateToFirstProblem(this.validationProblems());
		return;
	}
	if (this.flowType === 'checklist') {
		const firstUnreviewed = this.checklistControlNames().find((name) => !this.reviewed.has(name));
		if (firstUnreviewed) {
			this.renderIssues(this.lastValidation?.issues || []);
			const field = this.fields.get(firstUnreviewed);
			field?.wrap?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
			field?.choiceButtons?.yes?.focus?.({ preventScroll: true });
			return;
		}
	}
	const validation = this.valid && this.lastValidation ? this.lastValidation : await this.validate();
	if (!validation?.valid) {
		this.renderIssues(validation?.issues || []);
		this.refreshDetermination();
		await this.focusFirstInvalid(validation);
		return;
	}
	this.submitting = true;
	this.submitButton.disabled = true;
	this.setButtonBusy(this.submitButton, true, this.copy.submitting);
	this.setStatus('checking', this.copy.creating);
	this.emit('submit', { values: { ...this.values } });
	try {
		let signature = null;
		if (this.manifest.capabilities?.signing?.requested) {
			const mode = this.manifest.capabilities.signing.mode;
			if (mode === 'basic') {
				this.setStatus('checking', this.copy.awaitingSignature);
				signature = await this.collectBasicSignature();
				if (!signature) {
					this.submitting = false;
					this.updateSubmitState();
					this.setButtonBusy(this.submitButton, false, this.options.submitLabel || this.defaultSubmitLabel());
					this.setStatus('ready', this.copy.ready);
					return;
				}
				this.emit('signing', { mode, signature });
			} else {
				const nextAction = await this.api.prepareSigning(
					this.manifest.flow.ref,
					this.recordId,
					this.values,
					this.manifest.flow.effectiveAt
				);
				signature = await this.signing.handle(nextAction, { manifest: this.manifest, values: { ...this.values } });
				this.emit('signing', { mode, nextAction, signature });
			}
		}
		const result = await this.api.complete(
			this.manifest.flow.ref,
			this.recordId,
			normalizedResponses(this.manifest.schema?.definitions || {}, this.values),
			this.manifest.flow.effectiveAt,
			signature,
			this.locale
		);
		this.renderComplete(result);
		this.emit('complete', result);
	} catch (error) {
		this.submitting = false;
		if (error?.code === 'validation_failed' && Array.isArray(error?.details?.issues)) {
			this.valid = false;
			this.lastValidation = {
				...(this.lastValidation || {}),
				valid: false,
				status: error.details.status || 'INVALID',
				issues: error.details.issues
			};
			this.renderIssues(error.details.issues);
			this.refreshDetermination();
			await this.focusFirstInvalid(this.lastValidation);
		}
		this.updateSubmitState();
		this.setButtonBusy(this.submitButton, false, this.options.submitLabel || this.defaultSubmitLabel());
		this.formError.hidden = false;
		this.formError.textContent = errorMessage(error.code, error.message);
		this.setStatus('error', 'Submission not saved');
		this.emit('error', { error });
	}
}
