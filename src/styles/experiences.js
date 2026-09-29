export const experiencesStyles = `.guided-layout { display: grid; grid-template-columns: minmax(150px, .62fr) minmax(0, 1.55fr); gap: clamp(24px, 5vw, 54px); align-items: start; min-height: 390px; }
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
`;
