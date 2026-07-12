export class ProseIDError extends Error {
	constructor(code, message, status = 0, details = {}) {
		super(message);
		this.name = 'ProseIDError';
		this.code = code;
		this.status = status;
		this.details = details;
	}
}

const messages = {
	embed_origin_not_allowed: 'This website is not allowed to use this form.',
	form_not_found: 'This form is no longer available.',
	form_unpublished: 'This form is no longer available.',
	insufficient_balance: 'This form is temporarily unavailable. Contact its publisher.',
	rate_limited: 'Too many requests. Wait a moment and try again.',
	validation_failed: 'Check the highlighted fields and try again.',
	signing_not_available: 'Signing is not available in embedded forms yet.',
	service_unavailable: 'Validation is temporarily unavailable. Try again shortly.'
};

export function errorMessage(code, fallback = '') {
	return messages[code] || fallback || 'The request could not be completed.';
}
