export const appearanceStyles = `:host([data-proseid-shell="flat"]) .shell { border-color: transparent; box-shadow: none; }
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
`;
