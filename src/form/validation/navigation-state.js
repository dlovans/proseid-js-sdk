export function validationProblems() {
	const { fingerprint } = this.validationRequest();
	const localIssues = this.localValidationIssues(null, { includeRequired: true })
		.filter((issue) => issue?.severity === 'error');
	const problems = [];
	const seenFields = new Set();
	const add = (issue, kind = 'attention') => {
		const name = issue?.field_id || '';
		if (name) {
			const field = this.fields.get(name);
			if (!field || field.engineVisible === false || seenFields.has(name)) return;
			seenFields.add(name);
		}
		problems.push({ issue, name, kind });
	};

	for (const issue of localIssues) {
		const missing = issue.kind === 'missing_required' || issue.kind === 'attestation_incomplete';
		add(issue, missing ? 'missing' : 'attention');
	}
	if (this.flowType === 'checklist') {
		for (const name of this.checklistControlNames()) {
			if (!this.reviewed.has(name)) add({ field_id: name, severity: 'error', kind: 'missing_required', local: true }, 'missing');
		}
	}
	if (this.lastValidationFingerprint === fingerprint) {
		for (const issue of this.lastValidation?.issues || []) {
			if (issue?.severity === 'error') add(issue, 'attention');
		}
		if (this.lastValidation?.valid === false && problems.length === 0) add({ severity: 'error' }, 'attention');
	}
	return problems;
}

export function validationNavigatorState() {
	if (!this.manifest) return { state: 'checking', count: 0, label: this.copy.checkingAnswers, detail: '' };
	const problems = this.validationProblems();
	if (problems.length) {
		const needsAttention = problems.some((problem) => problem.kind === 'attention');
		return {
			state: needsAttention ? 'attention' : 'needed',
			count: problems.length,
			label: needsAttention
				? this.copy.answersNeedAttention(problems.length)
				: this.copy.answersNeeded(problems.length),
			detail: needsAttention ? this.copy.goToFirstAttention : this.copy.goToFirstUnfinished,
			problems
		};
	}
	const { fingerprint } = this.validationRequest();
	const currentResult = this.lastValidationFingerprint === fingerprint ? this.lastValidation : null;
	if (this.validationScheduled || this.validationInFlight || !currentResult) {
		return { state: 'checking', count: 0, label: this.copy.checkingAnswers, detail: this.copy.checkingAnswersHelp, problems: [] };
	}
	if (currentResult.valid === true) {
		return { state: 'ready', count: 0, label: this.copy.readyToComplete, detail: this.copy.answersChecked, problems: [] };
	}
	return {
		state: 'attention', count: 1, label: this.copy.answersNeedAttention(1),
		detail: this.copy.goToFirstAttention, problems: [{ issue: { severity: 'error' }, name: '', kind: 'attention' }]
	};
}
