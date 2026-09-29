export const responsiveStyles = `@keyframes shimmer { to { background-position: -200% 0; } }
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
