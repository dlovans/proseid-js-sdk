export const styles = `
:host {
	--proseid-accent: #ff4d1f;
	--proseid-accent-ink: #b82d0d;
	--proseid-canvas: #f5f6f5;
	--proseid-surface: #ffffff;
	--proseid-ink: #171918;
	--proseid-copy: #515653;
	--proseid-muted: #6c726e;
	--proseid-rule: #dfe2df;
	--proseid-success: #167653;
	--proseid-success-tint: #e8f5ef;
	--proseid-submit-ink: #171918;
	--proseid-skeleton-glow: #ffffff;
	--proseid-color-scheme: light;
	--proseid-radius: 16px;
	--proseid-control-radius: 11px;
	--proseid-button-radius: 11px;
	--proseid-head-pad-y: 24px;
	--proseid-head-pad-x: 26px;
	--proseid-body-pad: 26px;
	--proseid-field-gap: 18px;
	--proseid-font: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	display: block;
	color: var(--proseid-ink);
	font-family: var(--proseid-font);
	font-synthesis: none;
	color-scheme: var(--proseid-color-scheme);
}
:host([data-proseid-shape="capsule"]) { --proseid-radius: 22px; --proseid-control-radius: 999px; --proseid-button-radius: 999px; }
:host([data-proseid-shape="rigid"]) { --proseid-radius: 2px; --proseid-control-radius: 0px; --proseid-button-radius: 0px; }
:host([data-proseid-density="compact"]) { --proseid-head-pad-y: 18px; --proseid-head-pad-x: 20px; --proseid-body-pad: 20px; --proseid-field-gap: 13px; }
* { box-sizing: border-box; }
button, input, select, textarea { font: inherit; }
.shell { overflow: hidden; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-radius); background: var(--proseid-surface); box-shadow: 0 18px 55px rgba(22, 25, 23, .08); }
.ledger { height: 4px; background: linear-gradient(90deg, var(--proseid-accent) 0 18%, var(--proseid-rule) 18% 100%); }
.head { padding: var(--proseid-head-pad-y) var(--proseid-head-pad-x) calc(var(--proseid-head-pad-y) - 2px); border-bottom: 1px solid var(--proseid-rule); }
.brands { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 25px; }
.brands.publisher-only { justify-content: flex-start; }
.brand { display: flex; min-width: 0; align-items: center; gap: 10px; }
.brand img, .brand-fallback { width: 38px; height: 38px; flex: 0 0 38px; border-radius: 10px; object-fit: contain; }
.brand-fallback { display: grid; place-items: center; background: var(--proseid-canvas); color: var(--proseid-ink); font: 650 13px/1 Georgia, serif; }
.brand-copy { min-width: 0; }
.brand-name { overflow: hidden; font-size: 13px; font-weight: 680; text-overflow: ellipsis; white-space: nowrap; }
.brand-note { margin-top: 3px; color: var(--proseid-muted); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
.verified { color: var(--proseid-success); }
.proseid-brand { display: flex; flex: 0 0 auto; align-items: center; gap: 7px; color: var(--proseid-copy); font-size: 11px; text-decoration: none; }
.proseid-brand img { width: 24px; height: 24px; border-radius: 6px; }
.proseid-brand.compact span { display: none; }
h1 { max-width: 22ch; margin: 0; font: 500 clamp(25px, 5vw, 35px)/1.04 Georgia, "Times New Roman", serif; letter-spacing: -.025em; }
.description { max-width: 62ch; margin: 12px 0 0; color: var(--proseid-copy); font-size: 14px; line-height: 1.65; }
.schema-details { margin-top: 17px; border-top: 1px solid var(--proseid-rule); padding-top: 14px; }
.schema-details summary { width: fit-content; color: var(--proseid-copy); font-size: 11px; font-weight: 650; cursor: pointer; }
.schema-details summary::marker { color: var(--proseid-accent); }
.schema-details-content { display: grid; gap: 13px; margin-top: 13px; }
.schema-summary { margin: 0; color: var(--proseid-copy); font-size: 12px; line-height: 1.55; }
.metadata-group { display: grid; gap: 6px; }
.metadata-label { color: var(--proseid-muted); font-size: 9px; font-weight: 720; letter-spacing: .09em; text-transform: uppercase; }
.jurisdiction-list { display: flex; flex-wrap: wrap; gap: 6px; }
.jurisdiction { display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--proseid-rule); border-radius: 999px; background: var(--proseid-surface); padding: 4px 8px; color: var(--proseid-copy); font-size: 10px; line-height: 1.2; }
.jurisdiction code { color: var(--proseid-muted); font: 9px/1.2 ui-monospace, SFMono-Regular, Consolas, monospace; }
.reference-list { display: grid; gap: 6px; margin: 0; padding-left: 17px; color: var(--proseid-copy); font-size: 11px; line-height: 1.45; }
.reference-list a { color: var(--proseid-accent-ink); text-underline-offset: 2px; }
.status { display: flex; align-items: center; gap: 9px; margin-top: 20px; color: var(--proseid-muted); font-size: 11px; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; background: #aeb4b0; }
.status[data-state="checking"] .status-dot { background: var(--proseid-accent); animation: pulse 1s ease-in-out infinite; }
.status[data-state="ready"] { color: var(--proseid-success); }
.status[data-state="ready"] .status-dot { background: var(--proseid-success); }
.status[data-state="error"] { color: var(--proseid-accent-ink); }
.status[data-state="error"] .status-dot { background: var(--proseid-accent); }
.body { padding: calc(var(--proseid-body-pad) - 1px) var(--proseid-body-pad) var(--proseid-body-pad); background: color-mix(in srgb, var(--proseid-canvas) 42%, var(--proseid-surface)); }
.fields { display: grid; gap: var(--proseid-field-gap); }
.field { display: grid; gap: 7px; }
.field[hidden] { display: none; }
.label-row, .check-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.check-row .check { flex: 1 1 auto; }
.label { color: var(--proseid-ink); font-size: 12px; font-weight: 650; }
.required { display: inline-flex; align-items: center; margin-left: 7px; border: 1px solid color-mix(in srgb, var(--proseid-accent) 24%, var(--proseid-rule)); border-radius: 999px; background: color-mix(in srgb, var(--proseid-accent) 7%, var(--proseid-surface)); padding: 2px 6px; color: var(--proseid-accent-ink); font-size: 8px; font-weight: 750; letter-spacing: .06em; line-height: 1.2; text-transform: uppercase; vertical-align: 1px; }
.required[hidden] { display: none; }
.info-tip { position: relative; z-index: 1; flex: 0 0 auto; }
.info-trigger { display: grid; width: 19px; height: 19px; place-items: center; border: 1px solid var(--proseid-rule); border-radius: 50%; outline: 0; background: var(--proseid-surface); padding: 0; color: var(--proseid-muted); font: 700 11px/1 Georgia, serif; cursor: help; }
.info-trigger:focus-visible { border-color: var(--proseid-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--proseid-accent) 13%, transparent); }
.info-popover { position: absolute; right: 0; bottom: calc(100% + 8px); width: min(260px, calc(100vw - 60px)); border: 1px solid var(--proseid-rule); border-radius: 9px; background: var(--proseid-ink); box-shadow: 0 12px 35px rgba(0, 0, 0, .2); padding: 9px 10px; color: var(--proseid-surface); font-size: 10px; font-weight: 500; line-height: 1.5; opacity: 0; pointer-events: none; transform: translateY(3px); transition: opacity .14s ease, transform .14s ease; }
.info-tip:hover .info-popover, .info-tip:focus-within .info-popover { opacity: 1; transform: translateY(0); }
.hint { color: var(--proseid-muted); font-size: 11px; line-height: 1.45; }
.field-message { border-left: 2px solid var(--proseid-accent); padding-left: 9px; color: var(--proseid-copy); font-size: 11px; line-height: 1.5; }
.field-message[hidden] { display: none; }
.control { width: 100%; min-height: 44px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); outline: none; background: var(--proseid-surface); padding: 10px 12px; color: var(--proseid-ink); font-size: 14px; transition: border-color .16s ease, box-shadow .16s ease; }
.control:focus { border-color: var(--proseid-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--proseid-accent) 13%, transparent); }
.control[aria-invalid="true"] { border-color: var(--proseid-accent); }
select.control { appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--proseid-muted) 50%), linear-gradient(135deg, var(--proseid-muted) 50%, transparent 50%); background-position: calc(100% - 16px) 18px, calc(100% - 11px) 18px; background-size: 5px 5px; background-repeat: no-repeat; padding-right: 32px; }
textarea.control { min-height: 96px; resize: vertical; }
.date-control { position: relative; width: 100%; }
.date-input { padding-right: 47px; font-variant-numeric: tabular-nums; }
.date-trigger { position: absolute; top: 50%; right: 5px; display: grid; width: 34px; height: 34px; place-items: center; border: 0; border-radius: calc(var(--proseid-control-radius) - 3px); outline: none; background: transparent; color: var(--proseid-muted); cursor: pointer; transform: translateY(-50%); }
.date-trigger:hover, .date-trigger[aria-expanded="true"] { background: var(--proseid-canvas); color: var(--proseid-accent-ink); }
.date-trigger:focus-visible { outline: 2px solid var(--proseid-accent); outline-offset: 1px; }
.date-trigger svg { width: 17px; height: 17px; }
.date-panel { position: fixed; z-index: 2147483646; top: var(--date-top); left: var(--date-left); width: var(--date-width); max-height: calc(100dvh - 24px); overflow: auto; border: 1px solid var(--proseid-rule); border-radius: 17px; background: var(--proseid-surface); box-shadow: 0 25px 70px rgba(12, 15, 13, .22); color: var(--proseid-ink); }
.date-panel-head { display: flex; min-height: 73px; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 16px 12px; border-bottom: 1px solid var(--proseid-rule); }
.date-panel-title { display: grid; min-width: 0; gap: 2px; }
.date-panel-title span { color: var(--proseid-accent-ink); font-size: 8px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.date-panel-title strong { overflow: hidden; font: 500 21px/1.15 Georgia, serif; text-overflow: ellipsis; white-space: nowrap; }
.date-navigation { display: flex; gap: 5px; }
.date-navigation button { display: grid; width: 32px; height: 32px; place-items: center; border: 1px solid var(--proseid-rule); border-radius: 9px; background: var(--proseid-surface); color: var(--proseid-copy); font: 400 22px/1 Georgia, serif; cursor: pointer; }
.date-navigation button:hover { border-color: var(--proseid-accent); color: var(--proseid-accent-ink); }
.date-navigation button:focus-visible, .date-grid button:focus-visible, .date-panel-footer button:focus-visible { outline: 2px solid var(--proseid-accent); outline-offset: 2px; }
.date-weekdays, .date-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.date-weekdays { padding: 12px 13px 4px; }
.date-weekdays span { color: var(--proseid-muted); font-size: 8px; font-weight: 700; letter-spacing: .05em; text-align: center; text-transform: uppercase; }
.date-grid { gap: 2px; padding: 3px 13px 13px; }
.date-grid button { position: relative; display: grid; min-width: 0; aspect-ratio: 1; place-items: center; border: 0; border-radius: 9px; outline: none; background: transparent; color: var(--proseid-copy); font-size: 11px; font-weight: 650; cursor: pointer; }
.date-grid button:hover:not(:disabled) { background: var(--proseid-canvas); color: var(--proseid-ink); }
.date-grid button.outside { color: color-mix(in srgb, var(--proseid-muted) 55%, transparent); }
.date-grid button.today::after { position: absolute; bottom: 4px; width: 3px; height: 3px; border-radius: 50%; background: var(--proseid-accent); content: ''; }
.date-grid button.selected { background: var(--proseid-accent); color: var(--proseid-submit-ink); }
.date-grid button.selected::after { background: var(--proseid-submit-ink); }
.date-grid button:disabled { cursor: not-allowed; opacity: .24; }
.date-panel-footer { display: flex; justify-content: space-between; gap: 8px; border-top: 1px solid var(--proseid-rule); padding: 10px 14px 13px; }
.date-panel-footer button { min-height: 32px; border: 1px solid transparent; border-radius: 9px; background: transparent; padding: 6px 10px; color: var(--proseid-copy); font-size: 10px; font-weight: 700; cursor: pointer; }
.date-panel-footer button:hover:not(:disabled) { background: var(--proseid-canvas); color: var(--proseid-ink); }
.date-panel-footer button:disabled { cursor: not-allowed; opacity: .35; }
.date-panel-footer .today-action { border-color: color-mix(in srgb, var(--proseid-accent) 30%, var(--proseid-rule)); background: color-mix(in srgb, var(--proseid-accent) 7%, var(--proseid-surface)); color: var(--proseid-accent-ink); }
.check { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); background: var(--proseid-surface); cursor: pointer; }
.check input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
.toggle-track { position: relative; width: 34px; height: 20px; margin-top: 1px; border: 1px solid var(--proseid-rule); border-radius: 999px; background: var(--proseid-canvas); transition: border-color .16s ease, background .16s ease; }
.toggle-track::after { position: absolute; top: 3px; left: 3px; width: 12px; height: 12px; border-radius: 50%; background: var(--proseid-muted); content: ''; transition: background .16s ease, transform .16s ease; }
.check input:checked + .toggle-track { border-color: var(--proseid-accent); background: color-mix(in srgb, var(--proseid-accent) 16%, var(--proseid-surface)); }
.check input:checked + .toggle-track::after { background: var(--proseid-accent); transform: translateX(14px); }
.check input:focus-visible + .toggle-track { outline: 2px solid var(--proseid-accent); outline-offset: 3px; }
.check-copy { color: var(--proseid-copy); font-size: 13px; line-height: 1.5; }
.error { min-height: 0; color: var(--proseid-accent-ink); font-size: 11px; line-height: 1.45; }
.form-error { margin-bottom: 16px; border: 1px solid color-mix(in srgb, var(--proseid-accent) 28%, var(--proseid-rule)); border-radius: 11px; background: color-mix(in srgb, var(--proseid-accent) 6%, var(--proseid-surface)); padding: 11px 12px; color: var(--proseid-accent-ink); font-size: 12px; line-height: 1.5; }
.actions { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 18px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--proseid-rule); }
.privacy { display: flex; align-items: flex-start; gap: 7px; color: var(--proseid-muted); font-size: 10px; line-height: 1.5; }
.privacy svg { width: 13px; height: 13px; flex: 0 0 13px; margin-top: 1px; }
.submit { min-width: 128px; min-height: 42px; border: 0; border-radius: var(--proseid-button-radius); background: var(--proseid-accent); padding: 10px 17px; color: var(--proseid-submit-ink); font-size: 12px; font-weight: 720; cursor: pointer; transition: transform .15s ease, filter .15s ease; }
.submit:hover:not(:disabled) { filter: brightness(.94); transform: translateY(-1px); }
.submit:focus-visible { outline: 2px solid var(--proseid-ink); outline-offset: 3px; }
.submit:disabled { cursor: not-allowed; filter: grayscale(.25); opacity: .48; }
.eyebrow { color: var(--proseid-accent-ink); font-size: 9px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.primary-action, .secondary-action { min-height: 42px; border-radius: var(--proseid-button-radius); padding: 10px 16px; font-size: 12px; font-weight: 720; cursor: pointer; }
.primary-action { border: 1px solid var(--proseid-ink); background: var(--proseid-ink); color: var(--proseid-surface); }
.secondary-action { border: 1px solid var(--proseid-rule); background: transparent; color: var(--proseid-copy); }
.primary-action:disabled, .secondary-action:disabled { cursor: not-allowed; opacity: .45; }
.primary-action:focus-visible, .secondary-action:focus-visible, .review-change:focus-visible, .boolean-choice button:focus-visible { outline: 2px solid var(--proseid-accent); outline-offset: 3px; }

.guided-layout { display: grid; grid-template-columns: minmax(150px, .62fr) minmax(0, 1.55fr); gap: clamp(24px, 5vw, 54px); align-items: start; min-height: 390px; }
.guided-path { position: sticky; top: 20px; min-width: 0; }
.guided-path-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; color: var(--proseid-muted); font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.guided-path-heading strong { color: var(--proseid-ink); font: 500 17px/1 Georgia, serif; letter-spacing: 0; }
.guided-progress { height: 3px; margin: 12px 0 17px; overflow: hidden; border-radius: 2px; background: var(--proseid-rule); }
.guided-progress span { display: block; height: 100%; border-radius: inherit; background: var(--proseid-accent); transition: width .2s ease; }
.guided-path ol { display: grid; gap: 3px; margin: 0; padding: 0; list-style: none; }
.guided-path-button { display: grid; width: 100%; grid-template-columns: auto minmax(0, 1fr); gap: 8px; border: 0; background: transparent; padding: 6px 0; color: var(--proseid-muted); text-align: left; cursor: pointer; }
.guided-path-button:disabled { cursor: default; }
.guided-marker { display: grid; width: 17px; height: 17px; place-items: center; border: 1px solid var(--proseid-rule); border-radius: 50%; color: var(--proseid-surface); font-size: 9px; }
.answered .guided-marker { border-color: var(--proseid-success); background: var(--proseid-success); }
.active .guided-marker { border: 5px solid color-mix(in srgb, var(--proseid-accent) 15%, var(--proseid-surface)); background: var(--proseid-accent); box-shadow: 0 0 0 1px var(--proseid-accent); }
.guided-path-copy { display: grid; min-width: 0; gap: 2px; }
.guided-path-copy strong, .guided-path-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.guided-path-copy strong { color: var(--proseid-copy); font-size: 11px; }
.guided-path-copy small { color: var(--proseid-muted); font-size: 9px; }
.guided-index { margin-bottom: 18px; color: var(--proseid-accent-ink); font-size: 9px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.guided-field-slot { min-height: 215px; }
.guided-field-slot .label, .guided-field-slot .check-copy { font: 500 clamp(20px, 4vw, 27px)/1.2 Georgia, serif; letter-spacing: -.02em; }
.guided-field-slot .control { margin-top: 11px; min-height: 48px; font-size: 15px; }
.guided-navigation { display: flex; justify-content: space-between; gap: 12px; margin-top: 25px; padding-top: 18px; border-top: 1px solid var(--proseid-rule); }
.guided-review { grid-column: 1 / -1; width: min(700px, 100%); margin: 0 auto; }
.review-head h2, .experience-head h2, .determination-result h2, .checklist-title h2 { margin: 7px 0 0; font: 500 clamp(24px, 4vw, 32px)/1.08 Georgia, serif; letter-spacing: -.025em; }
.review-head p, .experience-head p, .checklist-title p { margin: 9px 0 0; color: var(--proseid-copy); font-size: 12px; line-height: 1.6; }
.review-list { margin-top: 24px; border-top: 1px solid var(--proseid-rule); }
.review-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding: 14px 0; border-bottom: 1px solid var(--proseid-rule); }
.review-answer { display: grid; min-width: 0; gap: 4px; }
.review-answer small, .outcome small { color: var(--proseid-muted); font-size: 9px; letter-spacing: .05em; text-transform: uppercase; }
.review-answer strong { overflow-wrap: anywhere; color: var(--proseid-ink); font-size: 13px; }
.review-change { border: 0; background: transparent; padding: 4px 0; color: var(--proseid-accent-ink); font-size: 11px; font-weight: 700; cursor: pointer; }
.guided-review .privacy { margin-top: 20px; }
.guided-review-actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 17px; padding-top: 18px; border-top: 1px solid var(--proseid-rule); }

.determination-layout { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(260px, .92fr); gap: clamp(28px, 5vw, 52px); align-items: start; }
.experience-head { margin-bottom: 23px; }
.determination-facts > .primary-action { width: 100%; margin-top: 22px; }
.determination-result { min-height: 280px; border-left: 3px solid var(--proseid-accent); border-radius: 0 var(--proseid-control-radius) var(--proseid-control-radius) 0; background: color-mix(in srgb, var(--proseid-accent) 7%, var(--proseid-surface)); padding: 24px; }
.determination-waiting { margin: 18px 0 0; color: var(--proseid-copy); font-size: 12px; line-height: 1.6; }
.outcome-list { display: grid; gap: 10px; margin-top: 20px; }
.outcome { border: 1px solid color-mix(in srgb, var(--proseid-accent) 20%, var(--proseid-rule)); border-radius: var(--proseid-control-radius); background: color-mix(in srgb, var(--proseid-surface) 84%, transparent); padding: 14px; }
.outcome strong { display: block; margin-top: 5px; color: var(--proseid-ink); font: 500 18px/1.2 Georgia, serif; overflow-wrap: anywhere; }
.outcome p { margin: 6px 0 0; color: var(--proseid-copy); font-size: 11px; line-height: 1.5; }

.checklist { display: grid; gap: 28px; }
.checklist-head { display: grid; grid-template-columns: minmax(0, 1fr) 170px; gap: 30px; align-items: end; padding-bottom: 22px; border-bottom: 1px solid var(--proseid-rule); }
.checklist-progress { padding-left: 18px; border-left: 1px solid var(--proseid-rule); }
.checklist-progress strong { display: block; font: 500 26px/1 Georgia, serif; }
.checklist-progress > span { display: block; margin-top: 5px; color: var(--proseid-muted); font-size: 8px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
.checklist-progress-rail { height: 3px; margin-top: 11px; overflow: hidden; border-radius: 2px; background: var(--proseid-rule); }
.checklist-progress-rail i { display: block; height: 100%; background: var(--proseid-accent); transition: width .2s ease; }
.checklist-section { display: grid; grid-template-columns: 145px minmax(0, 1fr); gap: 24px; }
.checklist-section h3 { margin: 0; font: 500 18px/1.2 Georgia, serif; }
.checklist-context-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--proseid-field-gap); }
.checklist-context-grid .field:has(textarea) { grid-column: 1 / -1; }
.checklist-control-list { display: grid; gap: 10px; }
.checklist-control-list .field { border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); background: var(--proseid-surface); padding: 15px; }
.checklist-control-list .check { border: 0; padding: 0; }
.checklist-boolean { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.checklist-boolean-copy { display: flex; min-width: 0; align-items: center; gap: 7px; }
.boolean-choice { display: inline-flex; flex: 0 0 auto; gap: 2px; border: 1px solid var(--proseid-rule); border-radius: 10px; background: var(--proseid-canvas); padding: 3px; }
.boolean-choice button { min-width: 50px; min-height: 31px; border: 0; border-radius: 7px; background: transparent; color: var(--proseid-muted); font-size: 11px; font-weight: 700; cursor: pointer; }
.boolean-choice button.selected { background: var(--proseid-ink); color: var(--proseid-surface); }
.empty-state { border: 1px dashed var(--proseid-rule); border-radius: var(--proseid-control-radius); padding: 25px; color: var(--proseid-copy); text-align: center; }
.signature-overlay { position: fixed; z-index: 2147483647; inset: 0; display: grid; place-items: center; background: rgba(18, 20, 19, .62); padding: 20px; }
.signature-dialog { width: min(480px, 100%); max-height: calc(100vh - 40px); overflow: auto; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-radius); background: var(--proseid-surface); box-shadow: 0 28px 90px rgba(0, 0, 0, .28); padding: 26px; }
.signature-eyebrow { margin-bottom: 9px; color: var(--proseid-accent-ink); font-size: 9px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.signature-dialog h2 { margin: 0; color: var(--proseid-ink); font: 500 28px/1.08 Georgia, "Times New Roman", serif; }
.signature-help { margin: 9px 0 0; color: var(--proseid-copy); font-size: 12px; line-height: 1.6; }
.signature-form { display: grid; gap: 10px; margin-top: 21px; }
.signature-label { color: var(--proseid-ink); font-size: 11px; font-weight: 650; }
.signature-input { width: 100%; min-height: 44px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); outline: 0; background: var(--proseid-surface); padding: 10px 12px; color: var(--proseid-ink); }
.signature-input:focus { border-color: var(--proseid-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--proseid-accent) 13%, transparent); }
.signature-acknowledgement { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 10px; margin-top: 5px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); padding: 12px; color: var(--proseid-copy); font-size: 10px; line-height: 1.55; cursor: pointer; }
.signature-acknowledgement input { width: 17px; height: 17px; margin: 1px 0 0; accent-color: var(--proseid-accent); }
.signature-error { min-height: 15px; margin: 0; color: var(--proseid-accent-ink); font-size: 10px; line-height: 1.45; }
.signature-actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 4px; }
.signature-cancel, .signature-confirm { min-height: 40px; border-radius: var(--proseid-button-radius); padding: 9px 14px; font-size: 11px; font-weight: 700; cursor: pointer; }
.signature-cancel { border: 1px solid var(--proseid-rule); background: var(--proseid-surface); color: var(--proseid-copy); }
.signature-confirm { border: 0; background: var(--proseid-accent); color: var(--proseid-submit-ink); }
.signature-cancel:focus-visible, .signature-confirm:focus-visible { outline: 2px solid var(--proseid-ink); outline-offset: 2px; }
.skeleton { padding: 28px; }
.skeleton-line { height: 12px; margin: 10px 0; border-radius: 8px; background: linear-gradient(90deg, var(--proseid-canvas), var(--proseid-skeleton-glow), var(--proseid-canvas)); background-size: 200% 100%; animation: shimmer 1.2s linear infinite; }
.skeleton-line:nth-child(2) { width: 62%; height: 30px; margin-top: 28px; }
.skeleton-line:nth-child(3) { width: 82%; }
.complete { padding: 42px 30px; text-align: center; }
.seal { display: grid; width: 54px; height: 54px; margin: 0 auto 20px; place-items: center; border: 1px solid color-mix(in srgb, var(--proseid-success) 25%, var(--proseid-rule)); border-radius: 50%; background: var(--proseid-success-tint); color: var(--proseid-success); font-size: 25px; }
.complete h2 { margin: 0; font: 500 30px/1.1 Georgia, serif; }
.complete p { max-width: 46ch; margin: 12px auto 0; color: var(--proseid-copy); font-size: 13px; line-height: 1.6; }
.receipt { width: fit-content; max-width: 100%; margin: 22px auto 0; border: 1px solid var(--proseid-rule); border-radius: 10px; background: var(--proseid-canvas); padding: 9px 12px; color: var(--proseid-muted); font: 10px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace; overflow-wrap: anywhere; }
.receipt-copy { max-width: 520px; margin: 28px auto 0; border-top: 1px solid var(--proseid-rule); padding-top: 24px; text-align: left; }
.receipt-copy h3 { margin: 0; color: var(--proseid-ink); font: 650 14px/1.35 var(--proseid-font); }
.complete .receipt-help { max-width: none; margin: 5px 0 0; color: var(--proseid-muted); font-size: 11px; line-height: 1.55; }
.receipt-form { margin-top: 15px; }
.receipt-field { display: grid; gap: 7px; }
.receipt-label { color: var(--proseid-ink); font-size: 11px; font-weight: 650; }
.receipt-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
.receipt-input { width: 100%; min-width: 0; min-height: 42px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); outline: none; background: var(--proseid-surface); padding: 9px 11px; color: var(--proseid-ink); font-size: 13px; transition: border-color .16s ease, box-shadow .16s ease; }
.receipt-input:focus { border-color: var(--proseid-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--proseid-accent) 13%, transparent); }
.receipt-input[aria-invalid="true"] { border-color: var(--proseid-accent); }
.receipt-button { min-height: 42px; border: 0; border-radius: var(--proseid-button-radius); background: var(--proseid-ink); padding: 9px 15px; color: var(--proseid-surface); font-size: 11px; font-weight: 720; white-space: nowrap; cursor: pointer; transition: transform .15s ease, opacity .15s ease; }
.receipt-button:hover:not(:disabled) { transform: translateY(-1px); }
.receipt-button:focus-visible { outline: 2px solid var(--proseid-accent); outline-offset: 3px; }
.receipt-button:disabled { cursor: not-allowed; opacity: .42; }
.complete .receipt-status { min-height: 17px; max-width: none; margin: 0; color: var(--proseid-muted); font-size: 11px; line-height: 1.5; }
.complete .receipt-status[data-state="sent"] { color: var(--proseid-success); }
.complete .receipt-status[data-state="error"] { color: var(--proseid-accent-ink); }
.complete .receipt-test { margin-top: 18px; color: var(--proseid-muted); font-size: 11px; }
:host([data-proseid-shell="flat"]) .shell { border-color: transparent; box-shadow: none; }
:host([data-proseid-shell="flat"]) .ledger { height: 2px; }
:host([data-proseid-fields="underline"]) .control { border-width: 0 0 1px; border-radius: 0; background: transparent; padding-right: 0; padding-left: 0; }
:host([data-proseid-fields="underline"]) .control:focus { border-color: var(--proseid-accent); box-shadow: 0 2px 0 -1px var(--proseid-accent); }
:host([data-proseid-fields="underline"]) .check { border-width: 0 0 1px; border-radius: 0; background: transparent; padding-right: 0; padding-left: 0; }
:host([data-proseid-fields="underline"]) .receipt-input { border-width: 0 0 1px; border-radius: 0; background: transparent; padding-right: 0; padding-left: 0; }
:host([data-proseid-density="compact"]) .brands { margin-bottom: 18px; }
:host([data-proseid-density="compact"]) .control { min-height: 38px; padding-top: 7px; padding-bottom: 7px; }
:host([data-proseid-density="compact"]) .check { padding-top: 10px; padding-bottom: 10px; }
:host([data-proseid-density="compact"]) .actions { margin-top: 18px; padding-top: 16px; }
@keyframes shimmer { to { background-position: -200% 0; } }
@keyframes pulse { 50% { opacity: .35; transform: scale(.8); } }
@media (max-width: 560px) {
	.head, .body { padding-right: 18px; padding-left: 18px; }
	.actions { grid-template-columns: 1fr; }
	.submit { width: 100%; }
	.guided-layout, .determination-layout, .checklist-section { grid-template-columns: 1fr; }
	.guided-path { position: static; }
	.guided-path ol { display: none; }
	.guided-field-slot { min-height: 185px; }
	.guided-navigation .primary-action, .guided-navigation .secondary-action { flex: 1; }
	.checklist-head { grid-template-columns: 1fr; gap: 18px; }
	.checklist-progress { padding: 14px 0 0; border-top: 1px solid var(--proseid-rule); border-left: 0; }
	.checklist-context-grid { grid-template-columns: 1fr; }
	.checklist-boolean { align-items: stretch; flex-direction: column; }
	.boolean-choice { width: 100%; }
	.boolean-choice button { flex: 1; }
	.proseid-brand span { display: none; }
	.receipt-row { grid-template-columns: 1fr; }
	.receipt-button { width: 100%; }
	.signature-dialog { padding: 22px 18px; }
	.signature-actions { display: grid; grid-template-columns: 1fr 1fr; }
	.date-panel { border-radius: 14px; }
}
@media (prefers-reduced-motion: reduce) { .status-dot, .skeleton-line, .submit, .receipt-input, .receipt-button, .info-popover, .guided-progress span, .checklist-progress-rail i, .toggle-track, .toggle-track::after { animation: none; transition: none; } }
`;
