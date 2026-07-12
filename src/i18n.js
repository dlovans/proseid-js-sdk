const dictionaries = {
	en: {
		verifiedPublisher: '✓ Verified publisher',
		verifiedBy: 'Verified by',
		select: 'Select…',
		idle: 'Enter your details to check this form',
		checking: 'Checking your answers…',
		ready: 'Ready to submit',
		incomplete: 'Complete the required fields',
		checkFailed: 'Could not check this form. Try again.',
		creating: 'Creating the verified record…',
		submit: 'Submit',
		submitting: 'Submitting…',
		privacy: 'Checked by ProseID. Sent only when you submit.',
		completeTitle: 'Submission complete.',
		delivered: (publisher) => `Your responses were verified and delivered to ${publisher}.`,
		auditRecord: (id) => `Audit record ${id}`,
		formUnavailable: 'Form unavailable',
		required: (label) => `${label} is required.`,
		confirm: 'Please confirm to continue.',
		format: (label) => `${label} isn’t in the expected format.`,
		validValue: 'Please enter a valid value.',
		tooShort: 'This is too short.',
		tooLong: 'This is too long.',
		checkValue: 'Please check this value.'
	},
	sv: {
		verifiedPublisher: '✓ Verifierad utgivare',
		verifiedBy: 'Verifierat av',
		select: 'Välj…',
		idle: 'Fyll i uppgifterna för att kontrollera formuläret',
		checking: 'Kontrollerar dina svar…',
		ready: 'Redo att skicka',
		incomplete: 'Fyll i de obligatoriska fälten',
		checkFailed: 'Formuläret kunde inte kontrolleras. Försök igen.',
		creating: 'Skapar den verifierade posten…',
		submit: 'Skicka',
		submitting: 'Skickar…',
		privacy: 'Kontrolleras av ProseID. Skickas först när du väljer Skicka.',
		completeTitle: 'Inskickat.',
		delivered: (publisher) => `Dina svar verifierades och levererades till ${publisher}.`,
		auditRecord: (id) => `Revisionspost ${id}`,
		formUnavailable: 'Formuläret är inte tillgängligt',
		required: (label) => `${label} är obligatoriskt.`,
		confirm: 'Bekräfta för att fortsätta.',
		format: (label) => `${label} har inte rätt format.`,
		validValue: 'Ange ett giltigt värde.',
		tooShort: 'Värdet är för kort.',
		tooLong: 'Värdet är för långt.',
		checkValue: 'Kontrollera värdet.'
	}
};

export function messagesFor(locale = 'en', overrides = {}) {
	const language = String(locale).toLowerCase().split('-')[0];
	return { ...(dictionaries[language] ?? dictionaries.en), ...overrides };
}
