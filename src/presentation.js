const ATTRIBUTION_MODES = new Set(['full', 'compact', 'hidden']);
const SHAPES = new Set(['soft', 'capsule', 'rigid']);
const FIELD_STYLES = new Set(['outlined', 'underline']);
const SHELL_STYLES = new Set(['card', 'flat']);
const DENSITIES = new Set(['comfortable', 'compact']);

const PRESETS = {
	soft: { shape: 'soft', fields: 'outlined', shell: 'card', density: 'comfortable' },
	capsule: { shape: 'capsule', fields: 'outlined', shell: 'card', density: 'comfortable' },
	rigid: { shape: 'rigid', fields: 'outlined', shell: 'card', density: 'comfortable' },
	underline: { shape: 'rigid', fields: 'underline', shell: 'flat', density: 'comfortable' }
};

export function normalizeAttribution(value) {
	return ATTRIBUTION_MODES.has(value) ? value : 'full';
}

export function normalizeAppearance(value = 'soft') {
	if (typeof value === 'string') return { ...PRESETS[value] || PRESETS.soft };
	const base = { ...PRESETS[value?.preset] || PRESETS.soft };
	return {
		shape: SHAPES.has(value?.shape) ? value.shape : base.shape,
		fields: FIELD_STYLES.has(value?.fields) ? value.fields : base.fields,
		shell: SHELL_STYLES.has(value?.shell) ? value.shell : base.shell,
		density: DENSITIES.has(value?.density) ? value.density : base.density
	};
}

export function safeLogoUrl(value) {
	if (!value) return null;
	try {
		const url = new URL(String(value), globalThis.location?.href || 'https://proseid.com');
		if (url.protocol === 'https:') return url.href;
		if (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return url.href;
		return null;
	} catch {
		return null;
	}
}
