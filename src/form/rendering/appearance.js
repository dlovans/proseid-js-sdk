import { normalizeAppearance } from '../../presentation.js';
import { normalizeColors, normalizeTheme, THEMES } from '../../themes.js';

export function applyTheme(theme = {}, manifestColors = {}) {
	const name = normalizeTheme(theme);
	this.target.dataset.proseidTheme = name;
	// A Flow can publish a safe hosted palette. Embed callers retain the documented ability to
	// customize their own mount, so local exact-hex overrides intentionally win last.
	const colors = {
		...THEMES[name],
		...normalizeColors(manifestColors),
		...normalizeColors(this.options.colors)
	};
	for (const [key, value] of Object.entries(colors)) {
		const token = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
		this.target.style.setProperty(`--proseid-${token}`, value);
	}
}

export function applyAppearance(appearance) {
	const value = normalizeAppearance(appearance);
	this.target.dataset.proseidShape = value.shape;
	this.target.dataset.proseidFields = value.fields;
	this.target.dataset.proseidShell = value.shell;
	this.target.dataset.proseidDensity = value.density;
}
