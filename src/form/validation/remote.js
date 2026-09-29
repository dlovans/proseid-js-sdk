import { errorMessage } from '../../errors.js';

export async function validate() {
	if (this.destroyed || !this.manifest) return null;
	const { responses, fingerprint } = this.validationRequest();
	if (this.lastValidation && this.lastValidationFingerprint === fingerprint) {
		this.validationScheduled = false;
		this.renderIssues(this.lastValidation.issues || []);
		this.updateSubmitState();
		return this.lastValidation;
	}
	if (this.validationPromise && this.validationPromiseFingerprint === fingerprint) {
		return this.validationPromise;
	}
	const sequence = ++this.validationSequence;
	this.validationScheduled = false;
	this.validationInFlight = true;
	this.validationAbort?.abort();
	this.validationAbort = new AbortController();
	this.setStatus('checking', this.copy.checking);
	const signal = this.validationAbort.signal;
	const request = (async () => {
		try {
			const result = await this.api.validate(
				this.manifest.flow.ref,
				responses,
				this.manifest.flow.effectiveAt,
				this.locale,
				signal
			);
			if (sequence !== this.validationSequence) return null;
			this.lastValidation = result;
			this.lastValidationFingerprint = fingerprint;
			this.valid = result.valid === true;
			this.validationLocked = false;
			this.applyDefinitions(result.definitions || {});
			this.renderIssues(result.issues || []);
			if (this.flowType === 'determination') {
				this.determinationActivity?.classList.remove('evaluating');
				if (this.determinationActivity) this.determinationActivity.querySelector('span').textContent = this.copy.determinationAuto;
				this.refreshDetermination();
			}
			this.updateSubmitState();
			this.setStatus(this.valid ? 'ready' : 'idle', this.valid ? this.copy.ready : this.copy.incomplete);
			this.emit('validation', { valid: this.valid, status: result.status, issues: result.issues || [] });
			return result;
		} catch (error) {
			if (error?.name === 'AbortError') return null;
			if (sequence !== this.validationSequence) return null;
			this.valid = false;
			this.updateSubmitState();
			const message = errorMessage(error.code, this.copy.checkFailed);
			this.setStatus('error', message);
			if (error?.code === 'flow_changed' && this.formError) {
				this.validationLocked = true;
				this.formError.hidden = false;
				this.formError.textContent = message;
				this.updateSubmitState();
			}
			this.emit('error', { error });
			return null;
		}
	})();
	this.validationPromise = request;
	this.validationPromiseFingerprint = fingerprint;
	this.updateValidationNavigator();
	try {
		return await request;
	} finally {
		if (this.validationPromise === request) {
			this.validationPromise = null;
			this.validationPromiseFingerprint = '';
			this.validationAbort = null;
			this.validationInFlight = false;
			this.updateValidationNavigator();
		}
	}
}
