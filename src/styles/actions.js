export const actionsStyles = `.actions { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 18px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--proseid-rule); }
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

`;
