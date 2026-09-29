import { EMAIL_RE } from '../input-patterns.js';

export const isEmptyValue = (_definition, value) => value === undefined || value === null || value === '';

export const answerProvided = (definition, value) => {
	if (definition?.type === 'attestation' && definition?.required === true) return value === true;
	return !isEmptyValue(definition, value);
};

export const validIsoDate = (value) => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
	if (!match) return false;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const optionValues = (definition) => new Set((definition?.options || []).map((option) =>
	typeof option === 'object' ? option.value : option
));

export const localConstraintIssue = (name, definition, value, { includeRequired = false } = {}) => {
	const empty = isEmptyValue(definition, value);
	if (empty) {
		if (includeRequired && definition?.required === true) {
			return {
				field_id: name,
				severity: 'error',
				kind: definition.type === 'attestation' ? 'attestation_incomplete' : 'missing_required',
				trigger: 'correction',
				local: true
			};
		}
		return null;
	}
	if (definition?.type === 'attestation' && definition.required === true && value !== true) {
		return { field_id: name, severity: 'error', kind: 'attestation_incomplete', trigger: 'correction', local: true };
	}
	if (definition?.type === 'boolean' && typeof value !== 'boolean') {
		return { field_id: name, severity: 'error', kind: 'type_mismatch', trigger: 'correction', local: true };
	}
	if (definition?.type === 'select' && !optionValues(definition).has(value)) {
		return { field_id: name, severity: 'error', kind: 'constraint_violation', trigger: 'correction', local: true };
	}
	if (['number', 'currency'].includes(definition?.type)) {
		if (typeof value !== 'number' || !Number.isFinite(value)) {
			return { field_id: name, severity: 'error', kind: 'type_mismatch', trigger: 'correction', local: true };
		}
		if (definition.min != null && value < Number(definition.min)) {
			return { field_id: name, severity: 'error', kind: 'constraint_violation', trigger: 'correction', local: true };
		}
		if (definition.max != null && value > Number(definition.max)) {
			return { field_id: name, severity: 'error', kind: 'constraint_violation', trigger: 'correction', local: true };
		}
	}
	if (definition?.type === 'date') {
		if (!validIsoDate(value)) {
			return { field_id: name, severity: 'error', kind: 'type_mismatch', trigger: 'correction', local: true };
		}
		if (definition.min && String(value) < String(definition.min)) {
			return { field_id: name, severity: 'error', kind: 'constraint_violation', trigger: 'correction', local: true };
		}
		if (definition.max && String(value) > String(definition.max)) {
			return { field_id: name, severity: 'error', kind: 'constraint_violation', trigger: 'correction', local: true };
		}
	}
	if (definition?.type === 'string') {
		if (typeof value !== 'string') {
			return { field_id: name, severity: 'error', kind: 'type_mismatch', trigger: 'correction', local: true };
		}
		if (definition.min_length != null && value.length < Number(definition.min_length)) {
			return { field_id: name, severity: 'error', kind: 'constraint_violation', trigger: 'correction', message: 'Too short.', local: true };
		}
		if (definition.max_length != null && value.length > Number(definition.max_length)) {
			return { field_id: name, severity: 'error', kind: 'constraint_violation', trigger: 'correction', message: 'Too long.', local: true };
		}
		if (definition.format === 'email' && !EMAIL_RE.test(value)) {
			return { field_id: name, severity: 'error', kind: 'type_mismatch', trigger: 'correction', local: true };
		}
		if (definition.pattern) {
			try {
				if (!new RegExp(definition.pattern).test(value)) {
					return { field_id: name, severity: 'error', kind: 'constraint_violation', trigger: 'correction', message: 'Pattern mismatch.', local: true };
				}
			} catch { /* The server remains authoritative for malformed publisher patterns. */ }
		}
	}
	return null;
};
