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
	publishable_key_required: 'This Flow is missing its ProseID publishable key.',
	invalid_publishable_key: 'This Flow is using an invalid or revoked ProseID key.',
	flow_not_allowed: 'This Flow is not available for this ProseID key.',
	embed_origin_not_allowed: 'This website is not allowed to use this Flow.',
	flow_not_found: 'This Flow is no longer available.',
	flow_unpublished: 'This Flow is no longer available.',
	insufficient_balance: 'This Flow is temporarily unavailable. Contact its publisher.',
	rate_limited: 'Too many requests. Wait a moment and try again.',
	validation_failed: 'Check the highlighted fields and try again.',
	invalid_email: 'Enter a valid email address.',
	receipt_not_available: 'This completed record is not available for email delivery.',
	email_not_configured: 'Email delivery is temporarily unavailable.',
	send_failed: 'The copy could not be sent. Try again.',
	signing_not_available: 'Signing is not available in embedded Standard Forms yet.',
	service_unavailable: 'Validation is temporarily unavailable. Try again shortly.'
};

export function errorMessage(code, fallback = '') {
	return messages[code] || fallback || 'The request could not be completed.';
}
