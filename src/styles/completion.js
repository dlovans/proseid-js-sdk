export const completionStyles = `.signature-overlay { position: fixed; z-index: 2147483647; inset: 0; display: grid; place-items: center; background: rgba(18, 20, 19, .62); padding: 20px; }
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
`;
