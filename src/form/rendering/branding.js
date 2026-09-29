import { safeLogoUrl } from '../../presentation.js';
import { text } from '../dom.js';

export function brand(publisher) {
	const wrap = text('div', 'brand');
	const organization = text('a', 'brand-organization');
	organization.href = this.registryUrl(`/registry/${encodeURIComponent(publisher.slug)}`);
	organization.target = '_blank';
	organization.rel = 'noopener noreferrer';
	organization.setAttribute('aria-label', `Open ${publisher.name} in the ProseID Registry`);
	const customLogo = safeLogoUrl(this.options.branding?.logoUrl);
	const logo = customLogo || safeLogoUrl(publisher.logo);
	if (logo) {
		const img = document.createElement('img');
		img.src = logo;
		img.alt = this.options.branding?.logoAlt || `${publisher.name} logo`;
		organization.append(img);
	} else {
		organization.append(text('span', 'brand-fallback', publisher.name.slice(0, 2).toUpperCase()));
	}
	const copy = text('div', 'brand-copy');
	copy.append(text('div', 'brand-name', publisher.name));
	copy.append(text('div', 'brand-note', `@${publisher.slug}`));
	organization.append(copy);
	wrap.append(organization);
	const author = this.manifest.author;
	if (author?.username) {
		const authorLink = text('a', 'brand-author', `@${author.username}`);
		authorLink.href = this.registryUrl(`/registry/publishers/${encodeURIComponent(author.username)}`);
		authorLink.target = '_blank';
		authorLink.rel = 'noopener noreferrer';
		if (author.verified) {
			const verified = text('span', 'author-verified', '✓');
			verified.setAttribute('aria-label', 'Verified professional');
			verified.title = 'Verified professional';
			authorLink.append(verified);
		}
		wrap.append(authorLink);
	}
	return wrap;
}

export function registryUrl(path) {
	const base = safeLogoUrl(this.manifest?.branding?.proseid?.url) || 'https://proseid.com/';
	return new URL(path, base).href;
}

export function proseidBrand() {
	if (this.attribution === 'hidden') return null;
	const brand = this.manifest.branding.proseid;
	const link = text('a', `proseid-brand${this.attribution === 'compact' ? ' compact' : ''}`);
	link.href = brand.url;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
	link.setAttribute('aria-label', `${this.copy.verifiedBy} ProseID`);
	const img = document.createElement('img');
	img.src = brand.logo;
	img.alt = 'ProseID';
	if (this.attribution === 'full') link.append(text('span', '', this.copy.verifiedBy));
	link.append(img);
	return link;
}
