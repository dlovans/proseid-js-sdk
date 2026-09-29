import { localConstraintIssue } from './local-constraints.js';

export function localValidationIssues(names, { includeRequired = false } = {}) {
	const selected = names ? new Set(names) : null;
	const issues = [];
	for (const [name, field] of this.fields) {
		if (selected && !selected.has(name)) continue;
		if (field.engineVisible === false) continue;
		const issue = localConstraintIssue(name, field.definition, this.values[name], { includeRequired });
		if (issue) issues.push(issue);
	}
	return issues;
}

export function renderLocalIssues(names, issues = this.localValidationIssues(names)) {
	const selected = new Set(names || []);
	const retained = (this.lastValidation?.issues || []).filter((issue) => !selected.has(issue?.field_id));
	this.renderIssues([...retained, ...issues]);
}
