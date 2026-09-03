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
	min-width: 0;
	max-width: 100%;
	container-type: inline-size;
	color: var(--proseid-ink);
	font-family: var(--proseid-font);
	font-synthesis: none;
	color-scheme: var(--proseid-color-scheme);
}
:host([data-proseid-shape="capsule"]) { --proseid-radius: 22px; --proseid-control-radius: 999px; --proseid-button-radius: 999px; }
:host([data-proseid-shape="rigid"]) { --proseid-radius: 2px; --proseid-control-radius: 0px; --proseid-button-radius: 0px; }
:host([data-proseid-density="compact"]) { --proseid-head-pad-y: 16px; --proseid-head-pad-x: 18px; --proseid-body-pad: 18px; --proseid-field-gap: 11px; }
* { box-sizing: border-box; }
button, input, select, textarea { font: inherit; }
.shell { position: relative; width: 100%; min-width: 0; max-width: 100%; overflow: visible; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-radius); background: var(--proseid-surface); box-shadow: 0 18px 55px rgba(22, 25, 23, .08); }
.ledger { position: absolute; z-index: 2; top: -1px; right: -1px; left: -1px; height: max(4px, var(--proseid-radius)); overflow: hidden; border-radius: var(--proseid-radius) var(--proseid-radius) 0 0; pointer-events: none; }
.ledger::before { position: absolute; top: 0; right: 0; left: 0; height: 4px; background: var(--proseid-rule); box-shadow: 0 1px 0 color-mix(in srgb, var(--proseid-rule) 72%, transparent); content: ''; }
.ledger-fill { position: relative; z-index: 1; display: block; width: 0; height: 4px; background: var(--proseid-accent); transition: width .22s ease; }
.ledger.loading .ledger-fill { width: 34%; animation: ledger-loading 1.15s ease-in-out infinite alternate; }
.ledger.complete .ledger-fill { width: 100%; }
.head, .body, form, .fields, .field, .guided, .guided-layout, .guided-question, .determination, .determination-layout, .determination-facts, .checklist, .checklist-section, .actions { min-width: 0; max-width: 100%; }
.head { padding: var(--proseid-head-pad-y) var(--proseid-head-pad-x) calc(var(--proseid-head-pad-y) - 2px); border-bottom: 1px solid var(--proseid-rule); }
.brands { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 25px; }
.respondent-tools { display: flex; flex: 0 0 auto; align-items: center; gap: 12px; }
.language-controls { display: flex; flex: 0 0 auto; align-items: center; }
.language-selector { position: relative; display: inline-flex; flex: 0 0 auto; align-items: center; }
.language-selector select { min-height: 36px; appearance: none; border: 1px solid var(--proseid-rule); border-radius: 9px; background: var(--proseid-canvas); padding: 7px 29px 7px 10px; color: var(--proseid-ink); font-size: 10px; font-weight: 700; cursor: pointer; }
.language-selector select:hover { border-color: color-mix(in srgb, var(--proseid-ink) 26%, var(--proseid-rule)); background: var(--proseid-surface); }
.language-selector select:focus-visible { outline: 2px solid var(--proseid-accent); outline-offset: 2px; }
.language-chevron { position: absolute; right: 11px; top: 50%; width: 6px; height: 6px; border-right: 1.5px solid var(--proseid-muted); border-bottom: 1.5px solid var(--proseid-muted); pointer-events: none; transform: translateY(-68%) rotate(45deg); }
.language-selector-mobile { position: relative; display: none; }
.language-summary { display: flex; min-width: 46px; min-height: 34px; align-items: center; justify-content: space-between; gap: 7px; border: 1px solid var(--proseid-rule); border-radius: 9px; background: var(--proseid-canvas); padding: 7px 9px 7px 10px; color: var(--proseid-ink); font-size: 10px; font-weight: 750; cursor: pointer; list-style: none; }
.language-summary::-webkit-details-marker { display: none; }
.language-summary:hover { border-color: color-mix(in srgb, var(--proseid-ink) 26%, var(--proseid-rule)); background: var(--proseid-surface); }
.language-summary:focus-visible { outline: 2px solid var(--proseid-accent); outline-offset: 2px; }
.language-summary-chevron { width: 6px; height: 6px; border-right: 1.5px solid var(--proseid-muted); border-bottom: 1.5px solid var(--proseid-muted); transform: translateY(-2px) rotate(45deg); transition: transform .16s ease; }
.language-selector-mobile[open] .language-summary-chevron { transform: translateY(2px) rotate(225deg); }
.language-menu { position: absolute; z-index: 30; top: calc(100% + 6px); right: 0; display: grid; width: max-content; min-width: 126px; overflow: hidden; border: 1px solid var(--proseid-rule); border-radius: 10px; background: var(--proseid-surface); padding: 4px; box-shadow: 0 14px 32px rgba(22, 25, 23, .14); }
.language-option { border: 0; border-radius: 7px; background: transparent; padding: 9px 10px; color: var(--proseid-copy); font-size: 11px; font-weight: 650; text-align: left; cursor: pointer; }
.language-option:hover, .language-option:focus-visible { outline: 0; background: var(--proseid-canvas); color: var(--proseid-ink); }
.language-option[aria-current="true"] { color: var(--proseid-accent-ink); }
.brand { display: flex; min-width: 0; flex-wrap: wrap; align-items: center; gap: 7px 10px; }
.brand-organization { display: flex; min-width: 0; align-items: center; gap: 10px; color: inherit; text-decoration: none; }
.brand-organization:hover .brand-name, .brand-author:hover { text-decoration: underline; text-underline-offset: 2px; }
.brand-organization:focus-visible, .brand-author:focus-visible { border-radius: 4px; outline: 2px solid var(--proseid-accent); outline-offset: 3px; }
.brand img, .brand-fallback { width: 38px; height: 38px; flex: 0 0 38px; border-radius: 10px; object-fit: contain; }
.brand-fallback { display: grid; place-items: center; background: var(--proseid-canvas); color: var(--proseid-ink); font: 650 13px/1 Georgia, serif; }
.brand-copy { min-width: 0; }
.brand-name { overflow: hidden; font-size: 13px; font-weight: 680; text-overflow: ellipsis; white-space: nowrap; }
.brand-note { margin-top: 3px; color: var(--proseid-muted); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
.brand-author { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 5px; color: var(--proseid-muted); font-size: 10px; font-weight: 650; text-decoration: none; }
.author-verified { display: inline-grid; width: 14px; height: 14px; place-items: center; border-radius: 50%; background: var(--proseid-success); color: #ffffff; font-size: 9px; font-weight: 800; line-height: 1; text-decoration: none; }
.proseid-brand { display: flex; flex: 0 0 auto; align-items: center; gap: 7px; border: 1px solid #dfe2df; border-radius: 999px; background: #ffffff; padding: 4px 8px 4px 5px; color: #454a47; font-size: 11px; text-decoration: none; }
.proseid-brand img { width: 24px; height: 24px; border-radius: 6px; }
.proseid-brand.compact { border: 0; border-radius: 0; background: transparent; padding: 0; }
.proseid-brand.compact img { border-radius: 0; }
h1 { max-width: 22ch; margin: 0; font: 500 clamp(25px, 5vw, 35px)/1.04 Georgia, "Times New Roman", serif; letter-spacing: -.025em; }
.description { max-width: 62ch; margin: 12px 0 0; color: var(--proseid-copy); font-size: 14px; line-height: 1.65; }
.schema-details { margin-top: 17px; border-top: 1px solid var(--proseid-rule); padding-top: 14px; }
.schema-details summary { width: fit-content; color: var(--proseid-copy); font-size: 11px; font-weight: 650; cursor: pointer; }
.schema-details summary::marker { color: var(--proseid-accent); }
.schema-details-content { display: grid; gap: 13px; margin-top: 13px; }
.schema-title { color: var(--proseid-ink); font: 500 16px/1.25 Georgia, serif; }
.schema-summary { margin: 0; color: var(--proseid-copy); font-size: 12px; line-height: 1.55; }
.temporal-context { display: flex; flex-wrap: wrap; gap: 6px 13px; color: var(--proseid-muted); font-size: 10px; }
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
.body { padding: calc(var(--proseid-body-pad) - 1px) var(--proseid-body-pad) var(--proseid-body-pad); border-radius: 0 0 var(--proseid-radius) var(--proseid-radius); background: color-mix(in srgb, var(--proseid-canvas) 42%, var(--proseid-surface)); }
.fields { display: grid; gap: var(--proseid-field-gap); }
.field { display: grid; gap: 7px; }
.field[hidden] { display: none; }
.label-row, .check-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.check-row .check { flex: 1 1 auto; }
.label { color: var(--proseid-ink); font-size: 12px; font-weight: 650; }
.required { display: inline-flex; align-items: center; margin-left: 7px; border: 1px solid color-mix(in srgb, var(--proseid-accent) 24%, var(--proseid-rule)); border-radius: 999px; background: color-mix(in srgb, var(--proseid-accent) 7%, var(--proseid-surface)); padding: 2px 6px; color: var(--proseid-accent-ink); font-size: 8px; font-weight: 750; letter-spacing: .06em; line-height: 1.2; text-transform: uppercase; vertical-align: 1px; }
.required[hidden] { display: none; }
.info-tip { position: relative; z-index: 1; flex: 0 0 auto; }
.info-trigger { display: grid; width: 19px; height: 19px; place-items: center; border: 1px solid var(--proseid-rule); border-radius: 50%; outline: 0; background: var(--proseid-surface); padding: 0; color: var(--proseid-muted); font: 700 11px/1 Georgia, serif; cursor: help; }
.info-trigger:focus-visible { border-color: var(--proseid-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--proseid-accent) 13%, transparent); }
.info-popover { position: absolute; right: 0; bottom: calc(100% + 8px); width: min(260px, calc(100vw - 60px)); border: 1px solid var(--proseid-rule); border-radius: 9px; background: var(--proseid-ink); box-shadow: 0 12px 35px rgba(0, 0, 0, .2); padding: 9px 10px; color: var(--proseid-surface); font-size: 10px; font-weight: 500; line-height: 1.5; opacity: 0; pointer-events: none; transform: translateY(3px); transition: opacity .14s ease, transform .14s ease; }
.info-tip:hover .info-popover, .info-tip:focus-within .info-popover { opacity: 1; transform: translateY(0); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; margin: -1px; padding: 0; border: 0; clip: rect(0, 0, 0, 0); white-space: nowrap; }
.boolean-field { min-width: 0; margin: 0; padding: 0; border: 0; }
.boolean-row { display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: 18px; min-height: 62px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); background: var(--proseid-surface); padding: 13px 14px; }
.boolean-copy { display: flex; min-width: 0; align-items: center; gap: 7px; color: var(--proseid-copy); font-size: 13px; line-height: 1.5; }
.boolean-row .boolean-choice label { position: relative; display: grid; min-width: 52px; min-height: 31px; place-items: center; border-radius: 7px; color: var(--proseid-muted); font-size: 11px; font-weight: 700; cursor: pointer; }
.boolean-row .boolean-choice label.selected { background: var(--proseid-surface); color: var(--proseid-ink); box-shadow: 0 2px 8px rgba(18, 20, 19, .12); }
.boolean-row .boolean-choice input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.boolean-row .boolean-choice label:has(input:focus-visible) { outline: 2px solid var(--proseid-accent); outline-offset: 2px; }
.field.highlight, .field.warning, .field.success, .field.error { border: 1px solid color-mix(in srgb, var(--proseid-accent) 30%, var(--proseid-rule)); border-radius: var(--proseid-control-radius); background: color-mix(in srgb, var(--proseid-accent) 5%, var(--proseid-surface)); padding: 12px; }
.field.muted { opacity: .72; }
.hint { color: var(--proseid-muted); font-size: 11px; line-height: 1.45; }
.field-message { border-left: 2px solid var(--proseid-accent); padding-left: 9px; color: var(--proseid-copy); font-size: 11px; line-height: 1.5; }
.field-message[hidden] { display: none; }
.control { width: 100%; min-height: 44px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); outline: none; background: var(--proseid-surface); padding: 10px 12px; color: var(--proseid-ink); font-size: 14px; transition: border-color .16s ease, box-shadow .16s ease; }
.control:focus { border-color: var(--proseid-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--proseid-accent) 13%, transparent); }
.control[aria-invalid="true"] { border-color: var(--proseid-accent); }
select.control { appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--proseid-muted) 50%), linear-gradient(135deg, var(--proseid-muted) 50%, transparent 50%); background-position: calc(100% - 16px) 50%, calc(100% - 11px) 50%; background-size: 5px 5px; background-repeat: no-repeat; padding-right: 32px; }
textarea.control { min-height: 150px; resize: vertical; line-height: 1.6; }
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
.date-panel-period { display: flex; min-width: 0; align-items: center; gap: 8px; }
.date-year-select { height: 30px; border: 1px solid var(--proseid-rule); border-radius: 9px; outline: none; appearance: none; background-color: var(--proseid-surface); background-image: linear-gradient(45deg, transparent 50%, var(--proseid-muted) 50%), linear-gradient(135deg, var(--proseid-muted) 50%, transparent 50%); background-position: calc(100% - 13px) 50%, calc(100% - 9px) 50%; background-size: 4px 4px; background-repeat: no-repeat; padding: 0 25px 0 9px; color: var(--proseid-ink); font: 650 10px var(--font-mono, ui-monospace, monospace); cursor: pointer; }
.date-year-select:focus-visible { border-color: var(--proseid-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--proseid-accent) 13%, transparent); }
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
.check { position: relative; display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: center; min-height: 62px; padding: 14px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); background: var(--proseid-surface); cursor: pointer; }
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
.action-meta { display: flex; min-width: 0; align-items: center; justify-content: flex-end; }
.standard-form-actions { grid-template-columns: minmax(0, 1fr); }
.standard-form-actions .submit { display: flex; width: 100%; align-items: center; justify-content: center; text-align: center; }
.privacy { display: flex; align-items: flex-start; gap: 7px; color: var(--proseid-muted); font-size: 10px; line-height: 1.5; }
.privacy svg { width: 13px; height: 13px; flex: 0 0 13px; margin-top: 1px; }
.submit { display: inline-flex; min-width: 128px; min-height: 42px; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: var(--proseid-button-radius); background: var(--proseid-accent); padding: 10px 17px; color: var(--proseid-submit-ink); font-size: 12px; font-weight: 720; cursor: pointer; transition: transform .15s ease, filter .15s ease; }
.submit:hover:not(:disabled) { filter: brightness(.94); transform: translateY(-1px); }
.submit:focus-visible { outline: 2px solid var(--proseid-ink); outline-offset: 3px; }
.submit:disabled { cursor: not-allowed; filter: grayscale(.25); opacity: .48; }
.submit[aria-busy="true"] { filter: none; opacity: 1; }
.button-spinner { width: 14px; height: 14px; flex: 0 0 14px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: button-spin .7s linear infinite; }
.button-label { white-space: nowrap; }
.validation-navigator-slot { position: relative; z-index: 40; display: flex; height: 46px; min-width: 46px; flex: 0 0 auto; justify-content: flex-end; pointer-events: none; }
.validation-navigator { display: flex; width: fit-content; height: 46px; max-width: 100%; flex: 0 0 auto; align-items: stretch; border: 1px solid transparent; border-radius: var(--proseid-control-radius); background: transparent; box-shadow: none; pointer-events: auto; transition: border-color .18s ease, background .18s ease, box-shadow .22s ease; }
.validation-navigator[data-open="true"] { border-color: color-mix(in srgb, var(--proseid-ink) 13%, var(--proseid-rule)); background: color-mix(in srgb, var(--proseid-surface) 94%, transparent); box-shadow: 0 18px 42px -22px rgba(18, 20, 19, .66); backdrop-filter: blur(14px); }
.validation-orb { position: relative; z-index: 1; display: grid; width: 44px; height: 44px; flex: 0 0 44px; place-items: center; border: 0; border-radius: var(--proseid-button-radius); outline: 0; background: var(--proseid-ink); padding: 0; color: var(--proseid-surface); font-size: 12px; font-weight: 780; cursor: pointer; transition: border-radius .22s ease, filter .16s ease; }
.validation-orb-value { grid-area: 1 / 1; }
.validation-orb:hover { filter: brightness(.94); }
.validation-navigator[data-open="true"] .validation-orb { border-radius: 0 var(--proseid-control-radius) var(--proseid-control-radius) 0; }
.validation-orb:focus-visible, .validation-jump:focus-visible { outline: 2px solid var(--proseid-accent); outline-offset: 3px; }
.validation-navigator[data-state="needed"] .validation-orb, .validation-navigator[data-state="attention"] .validation-orb { background: var(--proseid-accent); color: var(--proseid-submit-ink); }
.validation-navigator[data-state="ready"] .validation-orb { background: var(--proseid-success); color: var(--proseid-surface); }
.validation-navigator[data-state="checking"] .validation-orb::before { width: 16px; height: 16px; grid-area: 1 / 1; border: 2px solid color-mix(in srgb, var(--proseid-surface) 30%, transparent); border-top-color: var(--proseid-surface); border-radius: 50%; content: ''; animation: validation-spin .8s linear infinite; }
.validation-reveal { width: 0; min-width: 0; overflow: hidden; opacity: 0; pointer-events: none; transform: translateX(-8px); transition: width .34s cubic-bezier(.22, 1, .36, 1), opacity .18s ease, transform .34s cubic-bezier(.22, 1, .36, 1); }
.validation-navigator[data-open="true"] .validation-reveal { width: min(292px, calc(100cqw - 82px)); opacity: 1; transform: translateX(0); }
.validation-navigator[data-open="true"] .validation-reveal { pointer-events: auto; }
.validation-jump { display: grid; width: 100%; height: 44px; grid-template-columns: minmax(0, 1fr) 42px; align-items: stretch; border: 0; outline: 0; background: transparent; padding: 0; color: var(--proseid-ink); text-align: left; cursor: pointer; }
.validation-copy { display: grid; min-width: 0; align-content: center; gap: 2px; padding: 6px 12px 6px 13px; }
.validation-label, .validation-detail { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.validation-label { font-size: 11px; line-height: 1.2; }
.validation-detail { color: var(--proseid-muted); font-size: 8px; line-height: 1.25; }
.validation-arrow { display: grid; place-items: center; border-left: 1px solid var(--proseid-rule); color: var(--proseid-muted); font-size: 15px; }
.validation-navigator[data-state="ready"] .validation-label, .validation-navigator[data-state="ready"] .validation-arrow { color: var(--proseid-success); }
@keyframes validation-spin { to { transform: rotate(360deg); } }
.eyebrow { color: var(--proseid-accent-ink); font-size: 9px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.primary-action, .secondary-action { min-height: 42px; border-radius: var(--proseid-button-radius); padding: 10px 16px; font-size: 12px; font-weight: 720; white-space: nowrap; cursor: pointer; }
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
.guided-path ol { display: grid; max-height: min(48dvh, 440px); gap: 3px; overflow-y: auto; margin: 0; padding: 2px 7px 2px 2px; outline: 0; list-style: none; scrollbar-gutter: stable; scrollbar-width: thin; scrollbar-color: transparent transparent; }
.guided-path ol:hover, .guided-path ol:focus, .guided-path ol:focus-within { scrollbar-color: var(--proseid-rule) transparent; }
.guided-path ol:focus-visible { outline: 1px solid var(--proseid-accent); outline-offset: 2px; }
.guided-path ol::-webkit-scrollbar { width: 6px; }
.guided-path ol::-webkit-scrollbar-track { background: transparent; }
.guided-path ol::-webkit-scrollbar-thumb { border-radius: 999px; background: transparent; }
.guided-path ol:hover::-webkit-scrollbar-thumb, .guided-path ol:focus::-webkit-scrollbar-thumb, .guided-path ol:focus-within::-webkit-scrollbar-thumb { background: var(--proseid-rule); }
.guided-path li { min-width: 0; border: 1px solid transparent; border-radius: max(7px, calc(var(--proseid-radius) * .7)); transition: border-color .2s ease, background-color .2s ease; }
.guided-path li + li { margin-top: 4px; }
.guided-path li.active { margin-right: 2px; border-color: color-mix(in srgb, var(--proseid-accent) 20%, var(--proseid-rule)); background-color: color-mix(in srgb, var(--proseid-accent) 7%, var(--proseid-surface)); }
.guided-path-button { display: grid; width: 100%; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: 9px; border: 0; background: transparent; padding: 7px 8px; color: var(--proseid-muted); text-align: left; cursor: pointer; }
.guided-path-button:disabled { cursor: default; }
.guided-marker { display: grid; width: 17px; height: 17px; place-items: center; border: 1px solid var(--proseid-rule); border-radius: 50%; color: var(--proseid-surface); font-size: 9px; }
.answered .guided-marker { border-color: var(--proseid-success); background: var(--proseid-success); }
.active .guided-marker { border: 5px solid color-mix(in srgb, var(--proseid-accent) 15%, var(--proseid-surface)); background: var(--proseid-accent); box-shadow: 0 0 0 1px var(--proseid-accent); }
.active.answered .guided-marker { border: 1px solid var(--proseid-success); background: var(--proseid-success); box-shadow: none; }
.guided-path-copy { display: grid; min-width: 0; gap: 2px; }
.guided-path-copy strong, .guided-path-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.guided-path-copy strong { color: var(--proseid-copy); font-size: 11px; }
.guided-path-copy small { color: var(--proseid-muted); font-size: 9px; }
.guided-index { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; color: var(--proseid-accent-ink); font-size: 9px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; }
.guided-index small { max-width: 240px; color: var(--proseid-muted); font-size: 10px; font-weight: 500; letter-spacing: 0; line-height: 1.45; text-align: right; text-transform: none; }
.guided-question { display: flex; min-height: clamp(360px, 48dvh, 480px); flex-direction: column; border: 1px solid var(--proseid-rule); border-radius: calc(var(--proseid-radius) + 2px); background: var(--proseid-surface); padding: clamp(20px, 3.4vw, 31px); }
.guided-field-slot { min-height: 0; }
.guided-field-slot .label, .guided-field-slot .check-copy { font: 500 clamp(20px, 4vw, 27px)/1.2 Georgia, serif; letter-spacing: -.02em; }
.guided-field-slot .control { margin-top: 11px; min-height: 48px; font-size: 15px; }
.guided-navigation { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; padding-top: 18px; border-top: 1px solid var(--proseid-rule); }
.guided-path[hidden], .guided-question[hidden], .guided-review[hidden], .field-parking[hidden] { display: none !important; }
.guided-navigation > .validation-navigator-slot { min-width: 46px; max-width: 338px; flex: 1 1 46px; }
.guided-navigation > .primary-action, .guided-navigation > .secondary-action, .guided-review-actions > .primary-action, .guided-review-actions > .secondary-action, .guided-review-actions > .submit { flex: 0 0 auto; white-space: nowrap; }
.guided-review { grid-column: 1 / -1; width: 100%; min-width: 0; border: 1px solid var(--proseid-rule); border-radius: calc(var(--proseid-radius) + 2px); background: var(--proseid-surface); padding: clamp(20px, 3.4vw, 31px); }
.review-head h2, .experience-head h2, .checklist-title h2 { margin: 7px 0 0; font: 500 clamp(24px, 4vw, 32px)/1.08 Georgia, serif; letter-spacing: -.025em; }
.review-head p, .experience-head p, .checklist-title p { margin: 9px 0 0; color: var(--proseid-copy); font-size: 12px; line-height: 1.6; }
.review-list { margin-top: 24px; border-top: 1px solid var(--proseid-rule); }
.review-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding: 14px 0; border-bottom: 1px solid var(--proseid-rule); }
.review-answer { display: grid; min-width: 0; gap: 4px; }
.review-answer small { color: var(--proseid-muted); font-size: 9px; letter-spacing: .05em; text-transform: uppercase; }
.review-answer strong { overflow-wrap: anywhere; color: var(--proseid-ink); font-size: 13px; }
.review-change { border: 0; background: transparent; padding: 4px 0; color: var(--proseid-accent-ink); font-size: 11px; font-weight: 700; cursor: pointer; }
.guided-review .privacy { margin-top: 20px; }
.guided-review-readiness { display: flex; min-width: 0; justify-content: flex-end; margin-top: 17px; padding-top: 18px; border-top: 1px solid var(--proseid-rule); }
.guided-review-readiness > .validation-navigator-slot { width: min(338px, 100%); max-width: 100%; flex: 0 1 338px; container-type: inline-size; }
.guided-review-readiness .validation-navigator[data-open="true"] { width: 100%; }
.guided-review-readiness .validation-navigator[data-open="true"] .validation-reveal { width: auto; flex: 1 1 auto; }
.guided-review-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; }

.determination-layout { display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; width: min(100%, 760px); margin-inline: auto; }
.experience-head { margin-bottom: 23px; }
.determination-activity { display: inline-flex; align-items: center; gap: 8px; margin-top: 22px; color: var(--proseid-muted); font-size: 10px; }
.determination-activity i { width: 7px; height: 7px; border-radius: 50%; background: var(--proseid-success); box-shadow: 0 0 0 4px var(--proseid-success-tint); }
.determination-activity.evaluating i { background: var(--proseid-accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--proseid-accent) 12%, transparent); animation: pulse 1s ease-in-out infinite; }
.determination > .actions { grid-template-columns: minmax(0, 1fr) auto; width: min(100%, 760px); margin-inline: auto; }
.determination > .actions .submit { grid-column: 2; width: 100%; }

.checklist { display: grid; gap: 28px; }
.checklist-head { padding-bottom: 22px; border-bottom: 1px solid var(--proseid-rule); }
.checklist-progress { min-width: 150px; }
.checklist-progress strong { display: block; font: 500 26px/1 Georgia, serif; }
.checklist-progress > span { display: block; margin-top: 5px; color: var(--proseid-muted); font-size: 8px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
.checklist-progress-rail { height: 3px; margin-top: 11px; overflow: hidden; border-radius: 2px; background: var(--proseid-rule); }
.checklist-progress-rail i { display: block; height: 100%; background: var(--proseid-accent); transition: width .2s ease; }
.checklist-completion { position: sticky; bottom: 12px; z-index: 30; grid-template-columns: auto minmax(0, 1fr) auto; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-radius); background: color-mix(in srgb, var(--proseid-surface) 92%, transparent); padding: 11px 12px; box-shadow: 0 18px 45px -28px rgba(18, 20, 19, .72); backdrop-filter: blur(16px); }
.checklist-section { display: grid; grid-template-columns: 145px minmax(0, 1fr); gap: 24px; }
.checklist-section h3 { margin: 0; font: 500 18px/1.2 Georgia, serif; }
.checklist-section-head p { margin: 7px 0 0; color: var(--proseid-copy); font-size: 11px; line-height: 1.55; }
.checklist-context-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--proseid-field-gap); }
.checklist-context-grid .field:has(textarea) { grid-column: 1 / -1; }
.checklist-control-list { display: grid; gap: 10px; }
.checklist-control-list .field { border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); background: var(--proseid-surface); padding: 15px; }
.checklist-control-list .field:has(.check-row) { padding: 10px 12px; }
.checklist-control-list .check { min-height: 44px; border: 0; padding: 0; }
.checklist-control-list .error:empty { display: none; }
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
.signature-acknowledgement { position: relative; display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 10px; margin-top: 5px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); padding: 12px; color: var(--proseid-copy); font-size: 10px; line-height: 1.55; cursor: pointer; }
.signature-acknowledgement input { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
.signature-toggle { position: relative; width: 34px; height: 20px; margin-top: 1px; border: 1px solid var(--proseid-rule); border-radius: 999px; background: var(--proseid-canvas); }
.signature-toggle::after { position: absolute; top: 3px; left: 3px; width: 12px; height: 12px; border-radius: 50%; background: var(--proseid-muted); content: ''; transition: transform .16s ease, background .16s ease; }
.signature-acknowledgement input:checked + .signature-toggle { border-color: var(--proseid-accent); background: color-mix(in srgb, var(--proseid-accent) 16%, var(--proseid-surface)); }
.signature-acknowledgement input:checked + .signature-toggle::after { background: var(--proseid-accent); transform: translateX(14px); }
.signature-acknowledgement input:focus-visible + .signature-toggle { outline: 2px solid var(--proseid-accent); outline-offset: 2px; }
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
.completion-view { width: min(100%, 680px); margin: 0 auto; padding: 30px; text-align: left; }
.completion-summary { display: grid; grid-template-columns: 36px minmax(0, 1fr); align-items: start; gap: 13px; }
.completion-summary-copy { min-width: 0; }
.seal { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid color-mix(in srgb, var(--proseid-success) 26%, var(--proseid-rule)); border-radius: 50%; background: var(--proseid-success-tint); color: var(--proseid-success); font-size: 17px; font-weight: 720; }
.completion-view h2 { margin: 0; font: 500 22px/1.12 Georgia, serif; letter-spacing: -.015em; }
.completion-summary p { max-width: 54ch; margin: 5px 0 0; color: var(--proseid-copy); font-size: 11px; line-height: 1.55; }
.recorded-result { margin: 20px 0 0; overflow: hidden; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-radius); background: var(--proseid-surface); text-align: left; }
.recorded-result-head { padding: 16px 18px 14px; border-bottom: 1px solid var(--proseid-rule); }
.recorded-result-head h3 { margin: 5px 0 0; color: var(--proseid-ink); font: 500 19px/1.16 Georgia, serif; letter-spacing: -.015em; }
.completion-view .recorded-result-head p { max-width: none; margin: 5px 0 0; color: var(--proseid-copy); font-size: 10px; line-height: 1.5; }
.recorded-outcomes { display: grid; padding: 0 18px; }
.recorded-outcome { padding: 14px 0; border-bottom: 1px solid var(--proseid-rule); }
.recorded-outcome:last-child { border-bottom: 0; }
.recorded-outcome small { display: block; color: var(--proseid-muted); font-size: 9px; letter-spacing: .06em; text-transform: uppercase; }
.recorded-outcome strong { display: block; margin-top: 4px; color: var(--proseid-ink); font: 500 16px/1.25 Georgia, serif; overflow-wrap: anywhere; }
.completion-view .recorded-outcome p { max-width: none; margin: 5px 0 0; color: var(--proseid-copy); font-size: 10px; line-height: 1.5; }
.recorded-notices { margin: 0 18px 16px; padding-top: 13px; border-top: 1px solid var(--proseid-rule); }
.recorded-notices ul { display: grid; gap: 7px; margin: 9px 0 0; padding: 0; list-style: none; }
.recorded-notices li { position: relative; padding-left: 14px; color: var(--proseid-copy); font-size: 11px; line-height: 1.5; }
.recorded-notices li::before { position: absolute; top: .62em; left: 0; width: 5px; height: 5px; border-radius: 50%; background: var(--proseid-accent); content: ''; }
.receipt { width: fit-content; max-width: 100%; margin: 9px 0 0; border: 1px solid var(--proseid-rule); border-radius: 8px; background: var(--proseid-canvas); padding: 6px 9px; color: var(--proseid-muted); font: 9px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace; overflow-wrap: anywhere; }
.receipt-copy { margin: 18px 0 0; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-radius); background: var(--proseid-canvas); padding: 16px 18px; text-align: left; }
.receipt-copy h3 { margin: 0; color: var(--proseid-ink); font: 650 14px/1.35 var(--proseid-font); }
.completion-view .receipt-help { max-width: none; margin: 4px 0 0; color: var(--proseid-muted); font-size: 10px; line-height: 1.5; }
.receipt-form { margin-top: 12px; }
.receipt-field { display: grid; gap: 7px; }
.receipt-label { color: var(--proseid-ink); font-size: 11px; font-weight: 650; }
.receipt-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
.receipt-input { width: 100%; min-width: 0; min-height: 42px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); outline: none; background: var(--proseid-surface); padding: 9px 11px; color: var(--proseid-ink); font-size: 13px; transition: border-color .16s ease, box-shadow .16s ease; }
.receipt-input:focus { border-color: var(--proseid-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--proseid-accent) 13%, transparent); }
.receipt-input[aria-invalid="true"] { border-color: var(--proseid-accent); }
.receipt-button { display: inline-flex; min-height: 42px; align-items: center; justify-content: center; gap: 7px; border: 0; border-radius: var(--proseid-button-radius); background: var(--proseid-ink); padding: 9px 15px; color: var(--proseid-surface); font-size: 11px; font-weight: 720; white-space: nowrap; cursor: pointer; transition: transform .15s ease, opacity .15s ease; }
.receipt-button:hover:not(:disabled) { transform: translateY(-1px); }
.receipt-button:focus-visible { outline: 2px solid var(--proseid-accent); outline-offset: 3px; }
.receipt-button:disabled { cursor: not-allowed; opacity: .42; }
.receipt-button[aria-busy="true"] { opacity: 1; }
.completion-view .receipt-status { min-height: 17px; max-width: none; margin: 0; color: var(--proseid-muted); font-size: 11px; line-height: 1.5; }
.completion-view .receipt-status[data-state="sent"] { color: var(--proseid-success); }
.completion-view .receipt-status[data-state="error"] { color: var(--proseid-accent-ink); }
.completion-view .receipt-test { margin: 16px 0 0 49px; color: var(--proseid-muted); font-size: 10px; }
:host([data-proseid-shell="flat"]) .shell { border-color: transparent; box-shadow: none; }
:host([data-proseid-shell="flat"]) .ledger { height: 2px; }
:host([data-proseid-fields="underline"]) .control { border-width: 0 0 1px; border-radius: 0; background: transparent; padding-right: 0; padding-left: 0; }
:host([data-proseid-fields="underline"]) .control:focus { border-color: var(--proseid-accent); box-shadow: 0 2px 0 -1px var(--proseid-accent); }
:host([data-proseid-fields="underline"]) .check { border-width: 0 0 1px; border-radius: 0; background: transparent; padding-right: 0; padding-left: 0; }
:host([data-proseid-fields="underline"]) .receipt-input { border-width: 0 0 1px; border-radius: 0; background: transparent; padding-right: 0; padding-left: 0; }
:host([data-proseid-density="compact"]) .brands { gap: 12px; margin-bottom: 14px; }
:host([data-proseid-density="compact"]) .schema-details { margin-top: 12px; padding-top: 10px; }
:host([data-proseid-density="compact"]) .schema-details-content { gap: 9px; margin-top: 9px; }
:host([data-proseid-density="compact"]) .status { margin-top: 14px; }
:host([data-proseid-density="compact"]) .field { gap: 5px; }
:host([data-proseid-density="compact"]) .field.highlight,
:host([data-proseid-density="compact"]) .field.warning,
:host([data-proseid-density="compact"]) .field.success,
:host([data-proseid-density="compact"]) .field.error { padding: 9px; }
:host([data-proseid-density="compact"]) .control { min-height: 40px; padding-top: 7px; padding-bottom: 7px; }
:host([data-proseid-density="compact"]) textarea.control { min-height: 112px; }
:host([data-proseid-density="compact"]) .boolean-row { min-height: 50px; gap: 12px; padding: 9px 11px; }
:host([data-proseid-density="compact"]) .check { min-height: 50px; gap: 10px; padding: 9px 11px; }
:host([data-proseid-density="compact"]) .actions { gap: 12px; margin-top: 15px; padding-top: 13px; }

:host([data-proseid-density="compact"]) .guided-layout { min-height: 300px; gap: clamp(18px, 3vw, 30px); }
:host([data-proseid-density="compact"]) .guided-path { top: 14px; }
:host([data-proseid-density="compact"]) .guided-progress { margin: 9px 0 12px; }
:host([data-proseid-density="compact"]) .guided-path li + li { margin-top: 2px; }
:host([data-proseid-density="compact"]) .guided-path-button { gap: 7px; padding: 5px 6px; }
:host([data-proseid-density="compact"]) .guided-index { margin-bottom: 12px; }
:host([data-proseid-density="compact"]) .guided-question { min-height: clamp(280px, 38dvh, 370px); padding: clamp(16px, 2.4vw, 22px); }
:host([data-proseid-density="compact"]) .guided-field-slot .control { margin-top: 8px; min-height: 40px; }
:host([data-proseid-density="compact"]) .guided-navigation { padding-top: 12px; }
:host([data-proseid-density="compact"]) .guided-review { padding: clamp(16px, 2.4vw, 22px); }
:host([data-proseid-density="compact"]) .review-list { margin-top: 17px; }
:host([data-proseid-density="compact"]) .review-row { gap: 13px; padding: 10px 0; }
:host([data-proseid-density="compact"]) .guided-review .privacy { margin-top: 14px; }
:host([data-proseid-density="compact"]) .guided-review-readiness { margin-top: 12px; padding-top: 12px; }
:host([data-proseid-density="compact"]) .guided-review-actions { margin-top: 9px; }

:host([data-proseid-density="compact"]) .experience-head { margin-bottom: 16px; }
:host([data-proseid-density="compact"]) .determination-activity { margin-top: 15px; }

:host([data-proseid-density="compact"]) .checklist { gap: 18px; }
:host([data-proseid-density="compact"]) .checklist-head { padding-bottom: 14px; }
:host([data-proseid-density="compact"]) .checklist-progress-rail { margin-top: 8px; }
:host([data-proseid-density="compact"]) .checklist-section { gap: 16px; }
:host([data-proseid-density="compact"]) .checklist-section-head p { margin-top: 5px; }
:host([data-proseid-density="compact"]) .checklist-control-list { gap: 7px; }
:host([data-proseid-density="compact"]) .checklist-control-list .field { padding: 11px; }
:host([data-proseid-density="compact"]) .checklist-control-list .field:has(.check-row) { padding: 8px 10px; }
:host([data-proseid-density="compact"]) .checklist-control-list .check { min-height: 40px; padding: 0; }
:host([data-proseid-density="compact"]) .checklist-completion { bottom: 8px; padding: 8px 9px; }

:host([data-proseid-density="compact"]) .signature-dialog { padding: 20px; }
:host([data-proseid-density="compact"]) .signature-form { margin-top: 16px; }
:host([data-proseid-density="compact"]) .completion-view { padding: 22px; }
:host([data-proseid-density="compact"]) .recorded-result { margin-top: 15px; }
:host([data-proseid-density="compact"]) .recorded-result-head { padding: 13px 15px 11px; }
:host([data-proseid-density="compact"]) .recorded-outcomes { padding: 0 15px; }
:host([data-proseid-density="compact"]) .recorded-outcome { padding: 11px 0; }
:host([data-proseid-density="compact"]) .recorded-notices { margin: 0 15px 13px; padding-top: 10px; }
:host([data-proseid-density="compact"]) .receipt-copy { margin-top: 14px; padding: 13px 15px; }
@keyframes shimmer { to { background-position: -200% 0; } }
@keyframes pulse { 50% { opacity: .35; transform: scale(.8); } }
@keyframes ledger-loading { from { transform: translateX(-105%); } to { transform: translateX(295%); } }
@keyframes button-spin { to { transform: rotate(360deg); } }
@container (max-width: 720px) {
	.guided-layout, .determination-layout, .checklist-section { grid-template-columns: 1fr; }
	.determination > .actions { grid-template-columns: 1fr; }
	.determination > .actions .submit { grid-column: 1; }
	.guided-path { position: static; }
	.guided-path ol { display: none; }
	.guided-question { min-height: 0; }
	.guided-index { align-items: flex-start; flex-direction: column; gap: 5px; }
	.guided-index small { max-width: none; text-align: left; }
	.checklist-context-grid { grid-template-columns: 1fr; }
	.checklist-completion { grid-template-columns: 1fr; }
	.checklist-completion .privacy { display: none; }
}
@container (max-width: 520px) {
	.head, .body { padding-right: 18px; padding-left: 18px; }
	.completion-view { padding: 22px 18px; }
	.completion-summary { grid-template-columns: 32px minmax(0, 1fr); gap: 10px; }
	.seal { width: 32px; height: 32px; font-size: 14px; }
	.completion-view h2 { font-size: 19px; }
	.recorded-result-head, .receipt-copy { padding-right: 14px; padding-left: 14px; }
	.recorded-outcomes { padding-right: 14px; padding-left: 14px; }
	.recorded-notices { margin-right: 14px; margin-left: 14px; }
	.completion-view .receipt-test { margin-left: 42px; }
	.brands { align-items: flex-start; gap: 10px; }
	.brand { flex: 1 1 0; gap: 6px; }
	.brand-organization { width: 100%; gap: 8px; }
	.brand img, .brand-fallback { width: 34px; height: 34px; flex-basis: 34px; }
	.brand-name { font-size: 12px; }
	.brand-author { width: 100%; padding-left: 42px; }
	.respondent-tools { flex-direction: row; align-items: center; gap: 8px; }
	.language-selector { display: none; }
	.language-selector-mobile { display: block; }
	.proseid-brand { border: 0; border-radius: 0; background: transparent; padding: 0; }
	.proseid-brand img { width: 22px; height: 22px; border-radius: 0; }
	.actions { grid-template-columns: 1fr; }
	.submit { width: 100%; }
	.guided-navigation { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
	.guided-navigation > .validation-navigator-slot { width: 100%; grid-column: 1 / -1; grid-row: 1; }
	.guided-navigation > .secondary-action { width: 100%; grid-column: 1; grid-row: 2; }
	.guided-navigation > .primary-action { width: 100%; grid-column: 2; grid-row: 2; }
	.guided-navigation .validation-navigator[data-open="true"] { width: 100%; }
	.guided-navigation .validation-navigator[data-open="true"] .validation-reveal { width: auto; flex: 1 1 auto; }
	.guided-review-readiness > .validation-navigator-slot { width: 100%; flex-basis: 100%; }
	.guided-review-actions > .secondary-action { width: auto; min-width: 0; flex: 0 0 auto; }
	.guided-review-actions > .submit { width: auto; min-width: 0; flex: 1 1 auto; }
	.checklist-boolean, .boolean-row { align-items: stretch; flex-direction: column; }
	.boolean-choice { width: 100%; }
	.boolean-choice button, .boolean-row .boolean-choice label { flex: 1; }
	.receipt-row { grid-template-columns: 1fr; }
	.validation-navigator[data-open="true"] .validation-reveal { width: min(250px, calc(100cqw - 70px)); }
	.validation-detail { display: none; }
}
@media (max-width: 560px) {
	.head, .body { padding-right: 18px; padding-left: 18px; }
	.actions { grid-template-columns: 1fr; }
	.submit { width: 100%; }
	.guided-layout, .determination-layout, .checklist-section { grid-template-columns: 1fr; }
	.guided-path { position: static; }
	.guided-path ol { display: none; }
	.guided-question { min-height: 0; }
	.guided-index { align-items: flex-start; flex-direction: column; gap: 5px; }
	.guided-index small { max-width: none; text-align: left; }
	.guided-navigation { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
	.guided-navigation > .validation-navigator-slot { width: 100%; grid-column: 1 / -1; grid-row: 1; }
	.guided-navigation > .secondary-action { width: 100%; grid-column: 1; grid-row: 2; }
	.guided-navigation > .primary-action { width: 100%; grid-column: 2; grid-row: 2; }
	.guided-navigation .validation-navigator[data-open="true"] { width: 100%; }
	.guided-navigation .validation-navigator[data-open="true"] .validation-reveal { width: auto; flex: 1 1 auto; }
	.guided-review-readiness > .validation-navigator-slot { width: 100%; flex-basis: 100%; }
	.guided-review-actions > .secondary-action { width: auto; min-width: 0; flex: 0 0 auto; }
	.guided-review-actions > .submit { width: auto; min-width: 0; flex: 1 1 auto; }
	.checklist-completion { grid-template-columns: 1fr; }
	.checklist-completion .privacy { display: none; }
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
	.boolean-row { align-items: stretch; flex-direction: column; }
	.boolean-row .boolean-choice { width: 100%; }
	.boolean-row .boolean-choice label { flex: 1; }
	.respondent-tools { gap: 8px; }
}
@media (prefers-reduced-motion: reduce) { .status-dot, .skeleton-line, .submit, .receipt-input, .receipt-button, .button-spinner, .info-popover, .ledger-fill, .guided-progress span, .guided-path li, .checklist-progress-rail i, .toggle-track, .toggle-track::after, .validation-reveal, .validation-orb::before { animation: none; transition: none; } }
`;
