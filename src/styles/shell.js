export const shellStyles = `
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
`;
