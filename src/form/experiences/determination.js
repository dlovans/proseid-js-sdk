import { text } from '../dom.js';

export function renderDetermination() {
	const layout = text('div', 'determination-layout');
	const facts = text('section', 'determination-facts');
	const head = text('header', 'experience-head');
	head.append(text('span', 'eyebrow', this.copy.determinationFacts), text('h2', '', this.copy.determinationTitle), text('p', '', this.copy.determinationHelp));
	this.determinationActivity = text('div', 'determination-activity');
	this.determinationActivity.append(text('i', ''), text('span', '', this.copy.determinationPreparing));
	facts.append(head, this.fieldList, this.determinationActivity);
	layout.append(facts);
	const wrap = text('div', 'determination');
	wrap.append(layout, this.renderActions());
	return wrap;
}

export function refreshDetermination() {
	// The server may return calculated definitions during validation, but the SDK deliberately does
	// not reveal them here. The recorded result is rendered only from the completion response.
}
