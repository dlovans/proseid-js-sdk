export const normalizedResponses = (definitions, values) => Object.fromEntries(
	Object.entries(values).map(([name, value]) => {
		const definition = definitions?.[name];
		if (value === '' && ['select', 'date', 'number', 'currency'].includes(definition?.type)) return [name, undefined];
		return [name, value];
	})
);

export function validationRequest() {
	const responses = normalizedResponses(this.manifest.schema?.definitions || {}, this.values);
	const fingerprint = JSON.stringify([
		this.manifest.flow.ref,
		this.manifest.flow.effectiveAt,
		responses
	]);
	return { responses, fingerprint };
}

export function invalidateStaleValidationRequest() {
	if (!this.validationPromise) return;
	const { fingerprint } = this.validationRequest();
	if (fingerprint === this.validationPromiseFingerprint) return;
	this.validationSequence += 1;
	this.validationAbort?.abort();
	this.validationAbort = null;
	this.validationPromise = null;
	this.validationPromiseFingerprint = '';
	this.validationInFlight = false;
	this.updateValidationNavigator();
}

export function scheduleValidation(delay, names = null, { includeRequired = false } = {}) {
	clearTimeout(this.validationTimer);
	this.validationScheduled = true;
	this.updateValidationNavigator();
	this.validationTimer = setTimeout(() => {
		this.validationScheduled = false;
		const localIssues = names?.length ? this.localValidationIssues(names, { includeRequired }) : [];
		if (names?.length) this.renderLocalIssues(names, localIssues);
		if (localIssues.some((issue) => issue.severity === 'error')) {
			this.valid = false;
			this.updateSubmitState();
			this.setStatus('idle', this.copy.incomplete);
			return;
		}
		this.validate();
	}, Math.max(0, delay));
}
