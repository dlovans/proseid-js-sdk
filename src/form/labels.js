export const CHOICE_ACRONYMS = new Map([
	['ai', 'AI'], ['api', 'API'], ['ccpa', 'CCPA'], ['dns', 'DNS'], ['dora', 'DORA'], ['eea', 'EEA'],
	['eu', 'EU'], ['ftc', 'FTC'], ['gdpr', 'GDPR'], ['gpai', 'GPAI'], ['hipaa', 'HIPAA'], ['ict', 'ICT'],
	['it', 'IT'], ['i', 'I'], ['ii', 'II'], ['iii', 'III'], ['iv', 'IV'], ['v', 'V'], ['vi', 'VI'],
	['vii', 'VII'], ['viii', 'VIII'], ['ix', 'IX'], ['x', 'X'], ['xi', 'XI'], ['xii', 'XII'], ['xiii', 'XIII'],
	['nis2', 'NIS2'], ['osha', 'OSHA'], ['pdf', 'PDF'], ['sec', 'SEC'], ['tld', 'TLD'],
	['uk', 'UK'], ['us', 'US']
]);

export const humanizeText = (value) => {
	const source = String(value ?? '').trim();
	if (!source || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(source) || /^[a-z][a-z0-9+.-]*:\/\//i.test(source)) return source;
	const spaced = source.replace(/_+/g, ' ').replace(/\s+/g, ' ');
	return spaced.charAt(0).toLocaleUpperCase() + spaced.slice(1);
};

export const humanizeChoice = (value) => humanizeText(value).split(' ')
	.map((word) => CHOICE_ACRONYMS.get(word.toLocaleLowerCase()) ?? word)
	.join(' ');
