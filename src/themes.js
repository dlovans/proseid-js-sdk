export const THEMES = Object.freeze({
	light: Object.freeze({
		accent: '#ff4d1f', accentInk: '#b82d0d', canvas: '#f5f6f5', surface: '#ffffff',
		ink: '#171918', copy: '#515653', muted: '#6c726e', rule: '#dfe2df',
		success: '#167653', successTint: '#e8f5ef', submitInk: '#171918',
		skeletonGlow: '#ffffff', colorScheme: 'light'
	}),
	charcoal: Object.freeze({
		accent: '#ff6a3d', accentInk: '#ff9a7a', canvas: '#171b1c', surface: '#202526',
		ink: '#f4f6f5', copy: '#c4cbc7', muted: '#a2aba6', rule: '#3b4340',
		success: '#71d6aa', successTint: '#173a2e', submitInk: '#24120d',
		skeletonGlow: '#2c3331', colorScheme: 'dark'
	}),
	midnight: Object.freeze({
		accent: '#ff6841', accentInk: '#ff9a7e', canvas: '#111827', surface: '#182235',
		ink: '#f4f6fa', copy: '#cbd3e1', muted: '#a6b0c1', rule: '#344057',
		success: '#78d9b5', successTint: '#143b32', submitInk: '#24120d',
		skeletonGlow: '#24314a', colorScheme: 'dark'
	}),
	forest: Object.freeze({
		accent: '#ff6841', accentInk: '#ff9a7e', canvas: '#151c1a', surface: '#1e2825',
		ink: '#f5f7f2', copy: '#cbd2cb', muted: '#a9b2ac', rule: '#3b4943',
		success: '#7fd7aa', successTint: '#173a2c', submitInk: '#24120d',
		skeletonGlow: '#2b3834', colorScheme: 'dark'
	})
});

export const THEME_NAMES = Object.freeze(Object.keys(THEMES));

export function normalizeTheme(value) {
	return typeof value === 'string' && Object.hasOwn(THEMES, value) ? value : 'light';
}
