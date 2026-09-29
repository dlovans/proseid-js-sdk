import { answerProvided } from '../validation/local-constraints.js';
import { text } from '../dom.js';

export function renderGuided() {
	const guided = text('div', 'guided');
	this.guidedQuestion = text('section', 'guided-question');
	this.guidedIndexNode = text('div', 'guided-index');
	this.guidedFieldSlot = text('div', 'guided-field-slot');
	const navigation = text('div', 'guided-navigation');
	this.guidedNavigation = navigation;
	this.guidedBack = text('button', 'secondary-action', this.copy.back);
	this.guidedBack.type = 'button';
	this.guidedBack.addEventListener('click', () => this.guidedPrevious());
	this.guidedNext = text('button', 'primary-action', this.copy.continue);
	this.guidedNext.type = 'button';
	this.guidedNext.addEventListener('click', () => this.guidedContinue());
	navigation.append(this.guidedBack, this.validationNavigator, this.guidedNext);
	this.guidedQuestion.append(this.guidedIndexNode, this.guidedFieldSlot, navigation);

	this.guidedPath = text('aside', 'guided-path');
	this.guidedPathHeading = text('div', 'guided-path-heading');
	this.guidedPathHeadingLabel = text('span', '', this.copy.guidedPath);
	this.guidedPathHeadingCount = text('strong');
	this.guidedPathHeading.append(this.guidedPathHeadingLabel, this.guidedPathHeadingCount);
	this.guidedPathList = document.createElement('ol');
	this.guidedPathList.tabIndex = 0;
	this.guidedPathList.setAttribute('aria-label', this.copy.guidedPath);
	this.guidedPath.append(this.guidedPathHeading);
	if (this.progressEnabled()) {
		this.guidedPathProgress = text('div', 'guided-progress');
		this.guidedPathProgressFill = text('span');
		this.guidedPathProgress.append(this.guidedPathProgressFill);
		this.guidedPath.append(this.guidedPathProgress);
	}
	this.guidedPath.append(this.guidedPathList);
	this.guidedReview = text('section', 'guided-review');
	this.guidedReview.hidden = true;
	this.guidedParking = text('div', 'field-parking');
	this.guidedParking.hidden = true;
	for (const field of this.fields.values()) this.guidedParking.append(field.wrap);
	const layout = text('div', 'guided-layout');
	layout.append(this.guidedPath, this.guidedQuestion, this.guidedReview, this.guidedParking);
	guided.append(layout);
	this.refreshGuided();
	return guided;
}

export function refreshGuided() {
	if (!this.guidedQuestion) return;
	const list = this.guidedPathList;
	const previousPathScrollTop = list?.scrollTop || 0;
	if (this.validationNavigator?.parentNode !== this.guidedNavigation) {
		this.guidedNavigation.insertBefore(this.validationNavigator, this.guidedNext);
	}
	const entries = this.visibleFields();
	if (!entries.length) {
		this.guidedQuestion.replaceChildren(text('p', 'empty-state', 'This Flow has no visible questions.'));
		this.guidedPath.hidden = true;
		return;
	}
	this.guidedPath.hidden = false;
	this.guidedIndex = Math.min(this.guidedIndex, entries.length - 1);
	const [currentName, field] = entries[this.guidedIndex];
	for (const [, candidate] of entries) {
		candidate.wrap.hidden = candidate !== field;
		if (candidate !== field && candidate.wrap.parentNode !== this.guidedParking) this.guidedParking.append(candidate.wrap);
	}
	field.wrap.hidden = false;
	if (this.guidedFieldSlot.childElementCount !== 1 || this.guidedFieldSlot.firstElementChild !== field.wrap) {
		this.guidedFieldSlot.replaceChildren(field.wrap);
	}
	this.guidedIndexNode.replaceChildren(
		text('span', '', this.copy.guidedProgress(this.guidedIndex + 1, entries.length)),
		text('small', '', this.guidedIndex === entries.length - 1 ? this.copy.guidedReviewCue : this.copy.guidedContinueCue)
	);
	this.guidedBack.disabled = this.guidedIndex === 0;
	this.guidedNext.disabled = this.guidedChecking;
	this.guidedNext.textContent = this.guidedIndex === entries.length - 1 ? this.copy.reviewAnswers : this.copy.continue;

	this.guidedPathHeadingLabel.textContent = this.copy.guidedPath;
	this.guidedPathHeadingCount.textContent = `${this.guidedIndex + 1}/${entries.length}`;
	list.setAttribute('aria-label', this.copy.guidedPath);
	if (this.guidedPathProgressFill) {
		const answered = entries.filter(([name, candidate]) => answerProvided(candidate.definition, this.values[name])).length;
		this.guidedPathProgressFill.style.width = `${Math.round((answered / entries.length) * 100)}%`;
	}

	const existingItems = new Map([...list.children].map((item) => [item.dataset.field, item]));
	const nextItems = entries.map(([entryName, entryField], index) => {
		let item = existingItems.get(entryName);
		if (!item) {
			item = text('li');
			item.dataset.field = entryName;
			const button = text('button', 'guided-path-button');
			button.type = 'button';
			const marker = text('span', 'guided-marker');
			const pathCopy = text('span', 'guided-path-copy');
			pathCopy.append(text('strong'), text('small'));
			button.append(marker, pathCopy);
			let navigatedOnPointerDown = false;
			button.addEventListener('pointerdown', (event) => {
				if (button.disabled || event.button !== 0) return;
				navigatedOnPointerDown = true;
				event.preventDefault();
				this.goToGuidedQuestion(entryName);
			});
			button.addEventListener('click', (event) => {
				event.preventDefault();
				if (button.disabled) return;
				if (navigatedOnPointerDown) {
					navigatedOnPointerDown = false;
					return;
				}
				this.goToGuidedQuestion(entryName);
			});
			item.append(button);
		}
		const button = item.querySelector('.guided-path-button');
		const marker = item.querySelector('.guided-marker');
		const label = item.querySelector('.guided-path-copy strong');
		const detail = item.querySelector('.guided-path-copy small');
		const hasAnswer = answerProvided(entryField.definition, this.values[entryName]);
		const isActive = index === this.guidedIndex;
		item.className = isActive ? (hasAnswer ? 'active answered' : 'active') : hasAnswer ? 'answered' : 'remaining';
		if (isActive) item.setAttribute('aria-current', 'step');
		else item.removeAttribute('aria-current');
		button.disabled = isActive || !hasAnswer;
		marker.textContent = hasAnswer ? '✓' : '';
		label.textContent = entryField.label;
		detail.textContent = isActive
			? this.copy.guidedCurrent
			: hasAnswer
				? this.displayValue(this.values[entryName], entryField.definition)
				: this.copy.notAnswered;
		return item;
	});
	const currentItems = [...list.children];
	const structureChanged = currentItems.length !== nextItems.length
		|| currentItems.some((item, index) => item !== nextItems[index]);
	if (structureChanged) list.replaceChildren(...nextItems);
	// Branching can change the row set. Restore the inner position before paint; ordinary answer
	// and navigation updates keep the same list and rows, allowing their theme-aware transitions.
	list.scrollTop = previousPathScrollTop;
	requestAnimationFrame(() => {
		const active = list.querySelector('.active');
		if (!active || list.scrollHeight <= list.clientHeight) return;
		const listBounds = list.getBoundingClientRect();
		const activeBounds = active.getBoundingClientRect();
		let nextTop = list.scrollTop;
		if (activeBounds.top < listBounds.top) nextTop -= listBounds.top - activeBounds.top;
		else if (activeBounds.bottom > listBounds.bottom) nextTop += activeBounds.bottom - listBounds.bottom;
		if (Math.abs(nextTop - list.scrollTop) < 1) return;
		const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		list.scrollTo({ top: Math.max(0, nextTop), behavior: reducedMotion ? 'auto' : 'smooth' });
	});
}
