export const friendlyIssue = (issue, label, copy) => {
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
