import { text } from '../dom.js';
import { isoParts, iso } from './date-values.js';

export function renderDatePicker(id, definition, labelText) {
	const wrap = text('div', 'date-control');
	const input = document.createElement('input');
	input.id = id;
	input.type = 'text';
	input.inputMode = 'numeric';
	input.autocomplete = 'off';
	input.spellcheck = false;
	input.className = 'control date-input';
	input.placeholder = definition.placeholder || 'YYYY-MM-DD';
	const trigger = text('button', 'date-trigger');
	trigger.type = 'button';
	trigger.setAttribute('aria-label', this.copy.chooseDateFor(labelText));
	trigger.setAttribute('aria-haspopup', 'dialog');
	trigger.setAttribute('aria-expanded', 'false');
	trigger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 9.5h17"/></svg>';
	wrap.append(input, trigger);

	const today = new Date();
	const todayIso = iso(today.getFullYear(), today.getMonth() + 1, today.getDate());
	let anchor = isoParts(input.value) || isoParts(todayIso);
	let viewYear = anchor.year;
	let viewMonth = anchor.month;
	let panel = null;

	const allowed = (value) => {
		if (!isoParts(value)) return false;
		if (definition.min && value < String(definition.min)) return false;
		if (definition.max && value > String(definition.max)) return false;
		return true;
	};
	const monthTitle = () => new Intl.DateTimeFormat(this.locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
		.format(new Date(Date.UTC(viewYear, viewMonth - 1, 1)));
	const monthName = () => new Intl.DateTimeFormat(this.locale, { month: 'long', timeZone: 'UTC' })
		.format(new Date(Date.UTC(viewYear, viewMonth - 1, 1)));
	const yearOptions = () => {
		const minimumYear = isoParts(String(definition.min || ''))?.year ?? today.getFullYear() - 100;
		const maximumYear = isoParts(String(definition.max || ''))?.year ?? today.getFullYear() + 25;
		const firstYear = Math.min(minimumYear, viewYear);
		const lastYear = Math.max(maximumYear, viewYear);
		return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
	};
	const displayDate = (value) => {
		const parsed = isoParts(value);
		if (!parsed) return value;
		return new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
			.format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)));
	};

	const close = ({ focus = false } = {}) => {
		panel?.remove();
		panel = null;
		trigger.setAttribute('aria-expanded', 'false');
		if (focus) trigger.focus();
	};
	const choose = (value) => {
		if (!allowed(value)) return;
		input.value = value;
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
		close({ focus: true });
	};
	const clear = () => {
		input.value = '';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
		close({ focus: true });
	};
	const place = () => {
		if (!panel) return;
		const rect = trigger.getBoundingClientRect();
		const width = Math.min(326, window.innerWidth - 24);
		const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
		const height = Math.min(panel.getBoundingClientRect().height || 420, window.innerHeight - 24);
		const below = window.innerHeight - rect.bottom;
		const top = below >= height + 8 ? rect.bottom + 8 : Math.max(12, rect.top - height - 8);
		panel.style.setProperty('--date-left', `${left}px`);
		panel.style.setProperty('--date-top', `${top}px`);
		panel.style.setProperty('--date-width', `${width}px`);
	};

	const renderPanel = () => {
		if (!panel) return;
		panel.replaceChildren();
		const header = text('header', 'date-panel-head');
		const title = text('div', 'date-panel-title');
		const period = text('div', 'date-panel-period');
		const yearSelect = document.createElement('select');
		yearSelect.className = 'date-year-select';
		yearSelect.setAttribute('aria-label', this.copy.year);
		for (const year of yearOptions()) {
			const option = document.createElement('option');
			option.value = String(year);
			option.textContent = String(year);
			yearSelect.append(option);
		}
		yearSelect.value = String(viewYear);
		yearSelect.addEventListener('change', () => {
			viewYear = Number(yearSelect.value);
			renderPanel();
			place();
		});
		period.append(text('strong', '', monthName()), yearSelect);
		title.append(text('span', '', this.copy.selectDate), period);
		const navigation = text('nav', 'date-navigation');
		navigation.setAttribute('aria-label', 'Change month');
		const previous = text('button', '', '‹');
		previous.type = 'button';
		previous.setAttribute('aria-label', this.copy.previousMonth);
		const next = text('button', '', '›');
		next.type = 'button';
		next.setAttribute('aria-label', this.copy.nextMonth);
		const move = (delta) => {
			const date = new Date(Date.UTC(viewYear, viewMonth - 1 + delta, 1));
			viewYear = date.getUTCFullYear();
			viewMonth = date.getUTCMonth() + 1;
			renderPanel();
			place();
		};
		previous.addEventListener('click', () => move(-1));
		next.addEventListener('click', () => move(1));
		navigation.append(previous, next);
		header.append(title, navigation);

		const weekdays = text('div', 'date-weekdays');
		for (const day of this.copy.weekdays) weekdays.append(text('span', '', day));
		const grid = text('div', 'date-grid');
		grid.setAttribute('role', 'grid');
		grid.setAttribute('aria-label', monthTitle());
		const first = new Date(Date.UTC(viewYear, viewMonth - 1, 1));
		const startOffset = (first.getUTCDay() + 6) % 7;
		for (let index = 0; index < 42; index += 1) {
			const date = new Date(Date.UTC(viewYear, viewMonth - 1, index - startOffset + 1));
			const value = iso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
			const day = text('button', date.getUTCMonth() + 1 === viewMonth ? '' : 'outside', String(date.getUTCDate()));
			day.type = 'button';
			day.setAttribute('role', 'gridcell');
			day.setAttribute('aria-label', displayDate(value));
			day.setAttribute('aria-selected', String(input.value === value));
			if (input.value === value) day.classList.add('selected');
			if (todayIso === value) day.classList.add('today');
			day.disabled = !allowed(value);
			day.addEventListener('click', () => choose(value));
			grid.append(day);
		}

		const footer = text('footer', 'date-panel-footer');
		const clearButton = text('button', '', this.copy.clear);
		clearButton.type = 'button';
		clearButton.disabled = !input.value;
		clearButton.addEventListener('click', clear);
		const todayButton = text('button', 'today-action', this.copy.today);
		todayButton.type = 'button';
		todayButton.disabled = !allowed(todayIso);
		todayButton.addEventListener('click', () => choose(todayIso));
		footer.append(clearButton, todayButton);
		panel.append(header, weekdays, grid, footer);
	};
	const open = () => {
		if (panel) return close();
		anchor = isoParts(input.value) || isoParts(todayIso);
		viewYear = anchor.year;
		viewMonth = anchor.month;
		panel = text('section', 'date-panel');
		panel.setAttribute('role', 'dialog');
		panel.setAttribute('aria-label', this.copy.chooseDateFor(labelText));
		this.shadow.append(panel);
		trigger.setAttribute('aria-expanded', 'true');
		renderPanel();
		place();
		panel.querySelector('[aria-selected="true"]:not(:disabled), .today:not(:disabled), button:not(:disabled)')?.focus?.();
	};
	trigger.addEventListener('click', open);
	const outside = (event) => {
		const path = event.composedPath?.() || [];
		if (panel && !path.includes(panel) && !path.includes(wrap)) close();
	};
	const escape = (event) => {
		if (panel && event.key === 'Escape') {
			event.preventDefault();
			close({ focus: true });
		}
	};
	document.addEventListener('pointerdown', outside);
	document.addEventListener('keydown', escape);
	window.addEventListener('resize', place);
	window.addEventListener('scroll', place, true);
	this.cleanupFns.push(() => {
		close();
		document.removeEventListener('pointerdown', outside);
		document.removeEventListener('keydown', escape);
		window.removeEventListener('resize', place);
		window.removeEventListener('scroll', place, true);
	});
	return { input, wrap };
}
