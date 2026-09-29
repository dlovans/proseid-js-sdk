export const LANGUAGES = new Set(['en', 'sv']);

export const LANGUAGE_STORAGE_KEY = 'proseid_flow_language';

export const normalizeLocale = (value) => {
	const language = String(value || '').trim().toLowerCase().split('-')[0];
	return LANGUAGES.has(language) ? language : 'en';
};

export const readLocalePreference = () => {
	try {
		const value = globalThis.localStorage?.getItem?.(LANGUAGE_STORAGE_KEY);
		return LANGUAGES.has(value) ? value : '';
	} catch { return ''; }
};

export const saveLocalePreference = (value) => {
	try { globalThis.localStorage?.setItem?.(LANGUAGE_STORAGE_KEY, value); }
	catch { /* Storage can be unavailable in strict privacy modes. */ }
};
