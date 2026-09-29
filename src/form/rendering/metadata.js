import { safeLogoUrl } from '../../presentation.js';
import { text } from '../dom.js';

export function renderSchemaDetails() {
	const metadata = this.manifest.schema?.metadata || {};
	const title = String(metadata.title || this.manifest.schema?.title || '').trim();
	const description = String(metadata.description || '').trim();
	const jurisdictions = Array.isArray(metadata.jurisdictions) ? metadata.jurisdictions.filter(Boolean) : [];
	const references = Array.isArray(metadata.legal_references) ? metadata.legal_references.filter(Boolean) : [];
	const temporal = this.manifest.flow?.temporalContext;
	if (!title && !description && jurisdictions.length === 0 && references.length === 0 && !temporal?.logic_version) return null;

	const details = text('details', 'schema-details');
	details.append(text('summary', '', this.copy.schemaDetails));
	const content = text('div', 'schema-details-content');
	if (title && title !== this.manifest.flow.title) content.append(text('strong', 'schema-title', title));
	if (description && description !== this.manifest.flow.description) {
		content.append(text('p', 'schema-summary', description));
	}
	if (temporal?.logic_version) {
		const period = text('div', 'temporal-context');
		period.append(
			text('span', '', this.copy.appliesOn(this.manifest.flow.effectiveAt)),
			text('span', '', this.copy.interpretation(temporal.logic_version))
		);
		content.append(period);
	}
	if (jurisdictions.length) {
		const group = text('div', 'metadata-group');
		group.append(text('div', 'metadata-label', this.copy.jurisdictions));
		const values = text('div', 'jurisdiction-list');
		for (const jurisdiction of jurisdictions) {
			const code = String(jurisdiction).toUpperCase();
			const chip = text('span', 'jurisdiction', jurisdictionName(code, this.locale));
			chip.append(text('code', '', code));
			values.append(chip);
		}
		group.append(values);
		content.append(group);
	}
	if (references.length) {
		const group = text('div', 'metadata-group');
		group.append(text('div', 'metadata-label', this.copy.legalReferences));
		const list = text('ul', 'reference-list');
		for (const reference of references) {
			const item = document.createElement('li');
			const label = [reference.instrument, reference.provision].filter(Boolean).join(' · ') || this.copy.legalReference;
			const source = safeLogoUrl(reference.source_url);
			if (source) {
				const link = text('a', '', label);
				link.href = source;
				link.target = '_blank';
				link.rel = 'noopener noreferrer';
				item.append(link);
			} else item.textContent = label;
			list.append(item);
		}
		group.append(list);
		content.append(group);
	}
	details.append(content);
	return details;
}

export const jurisdictionName = (value, locale = 'en') => {
	const code = String(value || '').trim().toUpperCase();
	const language = String(locale || 'en').toLowerCase().split('-')[0];
	const supranational = language === 'sv'
		? { GLOBAL: 'Globalt', EU: 'Europeiska unionen', EEA: 'Europeiska ekonomiska samarbetsområdet' }
		: { GLOBAL: 'Global', EU: 'European Union', EEA: 'European Economic Area' };
	if (supranational[code]) return supranational[code];
	try { return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code; }
	catch { return code; }
};
