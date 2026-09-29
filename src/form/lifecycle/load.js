import { ProseIDError } from '../../errors.js';
import { messagesFor } from '../../i18n.js';
import { normalizeAttribution } from '../../presentation.js';
import { normalizeLocale, readLocalePreference } from './preferences.js';

export async function load() {
	try {
		this.manifest = await this.api.manifest(this.recordId);
		if (this.destroyed) return this;
		this.flowType = this.manifest.flow?.flowType || 'form';
		if (!FLOW_TYPES.has(this.flowType)) {
			throw new ProseIDError(
				'flow_type_not_supported',
				`This version of the JavaScript SDK cannot render the “${this.flowType}” Flow experience.`
			);
		}
		this.attribution = normalizeAttribution(this.manifest.presentation?.attribution ?? this.attribution);
		this.locale = this.explicitLocale || readLocalePreference() || normalizeLocale(this.manifest.flow?.language);
		this.copy = messagesFor(this.locale, this.options.messages);
		this.api.setAttribution?.(this.attribution);
		// Published Flows own their curated theme. The mount option remains the loading/test fallback,
		// but production presentation cannot drift between the hosted and embedded renderers.
		this.applyTheme(
			this.manifest.presentation?.theme ?? this.options.theme,
			this.manifest.presentation?.colors
		);
		this.applyAppearance(this.options.appearance ?? this.manifest.presentation?.appearance);
		if (this.manifest.capabilities?.signing?.requested && !this.manifest.capabilities.signing.available) {
			throw new ProseIDError('signing_not_available', 'Signing is not available in this embedded Flow yet.');
		}
		this.seedValues();
		this.renderForm();
		this.emit('ready', { manifest: this.manifest });
		if (this.options.initialCompletion) {
			this.renderComplete(this.options.initialCompletion);
			return this;
		}
		await this.validate();
		return this;
	} catch (error) {
		this.renderFatal(error);
		this.emit('error', { error });
		throw error;
	}
}

export function seedValues() {
	for (const [name, definition] of Object.entries(this.manifest.schema?.definitions || {})) {
		let value = definition?.value;
		if (
			definition?.readonly !== true &&
			this.options.initialValues &&
			Object.prototype.hasOwnProperty.call(this.options.initialValues, name)
		) value = this.options.initialValues[name];
		if (definition?.type === 'select' && (value === undefined || value === null)) value = '';
		if (definition?.type === 'attestation' && value !== true) value = false;
		this.values[name] = value;
	}
}

export const FLOW_TYPES = new Set(['form', 'guided_assessment', 'determination', 'checklist']);
