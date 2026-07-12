import { describe, expect, test } from 'vitest';
import { THEMES } from '../src/themes.js';

function luminance(hex) {
	const channels = hex.slice(1).match(/../g).map((value) => Number.parseInt(value, 16) / 255);
	const [red, green, blue] = channels.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(a, b) {
	const values = [luminance(a), luminance(b)].sort((left, right) => right - left);
	return (values[0] + 0.05) / (values[1] + 0.05);
}

describe('curated themes', () => {
	test.each(Object.entries(THEMES))('%s keeps body and status copy at WCAG AA contrast', (_name, theme) => {
		for (const token of ['ink', 'copy', 'muted', 'accentInk', 'success']) {
			expect(contrast(theme[token], theme.surface), `${token} on surface`).toBeGreaterThanOrEqual(4.5);
		}
		expect(contrast(theme.submitInk, theme.accent), 'button text on accent').toBeGreaterThanOrEqual(4.5);
	});
});
