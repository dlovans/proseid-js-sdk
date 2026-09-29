import { en } from './i18n/en.js';
import { sv } from './i18n/sv.js';

const dictionaries = { en, sv };

export function messagesFor(locale = 'en', overrides = {}) {
	const language = String(locale).toLowerCase().split('-')[0];
	return { ...(dictionaries[language] ?? dictionaries.en), ...overrides };
}
