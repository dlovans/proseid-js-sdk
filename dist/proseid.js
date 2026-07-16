// src/errors.js
var ProseIDError = class extends Error {
  constructor(code, message, status = 0, details = {}) {
    super(message);
    this.name = "ProseIDError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
};
var messages = {
  publishable_key_required: "This Flow is missing its ProseID publishable key.",
  invalid_publishable_key: "This Flow is using an invalid or revoked ProseID key.",
  flow_not_allowed: "This Flow is not available for this ProseID key.",
  embed_origin_not_allowed: "This website is not allowed to use this Flow.",
  flow_not_found: "This Flow is no longer available.",
  flow_unpublished: "This Flow is no longer available.",
  flow_type_not_supported: "This Flow experience is not supported by the installed JavaScript SDK version.",
  insufficient_balance: "This Flow is temporarily unavailable. Contact its publisher.",
  rate_limited: "Too many requests. Wait a moment and try again.",
  validation_failed: "Check the highlighted fields and try again.",
  signature_required: "A signature is required before this Flow can be completed.",
  invalid_signature: "The signature details are incomplete or invalid.",
  invalid_email: "Enter a valid email address.",
  receipt_not_available: "This completed record is not available for email delivery.",
  email_not_configured: "Email delivery is temporarily unavailable.",
  send_failed: "The copy could not be sent. Try again.",
  signing_not_available: "Signing is not available in this embedded Flow yet.",
  service_unavailable: "Validation is temporarily unavailable. Try again shortly."
};
function errorMessage(code, fallback = "") {
  return messages[code] || fallback || "The request could not be completed.";
}

// src/version.js
var VERSION = "0.7.0";

// src/presentation.js
var ATTRIBUTION_MODES = /* @__PURE__ */ new Set(["full", "compact", "hidden"]);
var SHAPES = /* @__PURE__ */ new Set(["soft", "capsule", "rigid"]);
var FIELD_STYLES = /* @__PURE__ */ new Set(["outlined", "underline"]);
var SHELL_STYLES = /* @__PURE__ */ new Set(["card", "flat"]);
var DENSITIES = /* @__PURE__ */ new Set(["comfortable", "compact"]);
var PRESETS = {
  soft: { shape: "soft", fields: "outlined", shell: "card", density: "comfortable" },
  capsule: { shape: "capsule", fields: "outlined", shell: "card", density: "comfortable" },
  rigid: { shape: "rigid", fields: "outlined", shell: "card", density: "comfortable" },
  underline: { shape: "rigid", fields: "underline", shell: "flat", density: "comfortable" }
};
function normalizeAttribution(value) {
  return ATTRIBUTION_MODES.has(value) ? value : "full";
}
function normalizeAppearance(value = "soft") {
  if (typeof value === "string") return { ...PRESETS[value] || PRESETS.soft };
  const base = { ...PRESETS[value?.preset] || PRESETS.soft };
  return {
    shape: SHAPES.has(value?.shape) ? value.shape : base.shape,
    fields: FIELD_STYLES.has(value?.fields) ? value.fields : base.fields,
    shell: SHELL_STYLES.has(value?.shell) ? value.shell : base.shell,
    density: DENSITIES.has(value?.density) ? value.density : base.density
  };
}
function safeLogoUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(String(value), globalThis.location?.href || "https://proseid.com");
    if (url.protocol === "https:") return url.href;
    if (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return url.href;
    return null;
  } catch {
    return null;
  }
}

// src/api.js
function parseFlowCoordinate(value) {
  const parts = String(value ?? "").split("/").filter(Boolean);
  if (parts.length !== 2) throw new ProseIDError("invalid_flow", 'Flow must be "publisher/slug".');
  return { publisher: parts[0], slug: parts[1] };
}
var EmbedApi = class {
  constructor({ apiBase = "https://proseid.com", apiKey, flow, testMode = false, attribution = "full", fetchImpl = globalThis.fetch }) {
    if (typeof fetchImpl !== "function") throw new ProseIDError("fetch_unavailable", "This browser cannot load the Flow.");
    if (!/^proseid_pk_[a-f0-9]{32,64}$/.test(String(apiKey || ""))) {
      throw new ProseIDError("invalid_api_key", "A ProseID publishable key is required.");
    }
    this.fetch = fetchImpl.bind(globalThis);
    this.apiKey = apiKey;
    this.attribution = normalizeAttribution(attribution);
    if (testMode) {
      this.endpoint = `${String(apiBase).replace(/\/$/, "")}/api/embed/v1/test`;
    } else {
      const { publisher, slug } = parseFlowCoordinate(flow);
      this.endpoint = `${String(apiBase).replace(/\/$/, "")}/api/embed/v1/flows/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`;
    }
  }
  setAttribution(value) {
    this.attribution = normalizeAttribution(value);
  }
  async request(body, signal) {
    const response = await this.fetch(this.endpoint, {
      method: body ? "POST" : "GET",
      mode: "cors",
      credentials: "omit",
      headers: {
        accept: "application/json",
        "x-proseid-key": this.apiKey,
        "x-proseid-sdk-version": VERSION,
        "x-proseid-attribution": this.attribution,
        ...body ? { "content-type": "application/json" } : {}
      },
      ...body ? { body: JSON.stringify(body) } : {},
      ...signal ? { signal } : {}
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.ok === false) {
      const code = payload?.error || `http_${response.status}`;
      throw new ProseIDError(code, errorMessage(code), response.status, payload);
    }
    return payload;
  }
  manifest(signal) {
    return this.request(null, signal);
  }
  validate(flowRef, responses, signal) {
    return this.request({ action: "validate", flowRef, responses }, signal);
  }
  prepareSigning(flowRef, recordId, responses, signal) {
    return this.request({ action: "prepare_signing", flowRef, recordId, responses }, signal);
  }
  complete(flowRef, recordId, responses, signature = null, signal) {
    return this.request({ action: "complete", flowRef, recordId, responses, signature }, signal);
  }
  emailReceipt(flowRef, recordId, email, signal) {
    return this.request({ action: "email_receipt", flowRef, recordId, email }, signal);
  }
};

// src/signing.js
var SigningCoordinator = class {
  constructor(adapter = null) {
    this.adapter = adapter;
  }
  async handle(nextAction, context) {
    if (!nextAction) return null;
    if (nextAction.type !== "sign" || typeof this.adapter?.sign !== "function") {
      throw new ProseIDError("signing_adapter_required", "This form requires a signing method that is not available here.");
    }
    return this.adapter.sign(nextAction, context);
  }
};

// src/styles.js
var styles = `
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

// src/i18n.js
var dictionaries = {
  en: {
    verifiedPublisher: "\u2713 Verified publisher",
    verifiedBy: "Verified by",
    select: "Select\u2026",
    schemaDetails: "Schema details",
    jurisdictions: "Applies in",
    legalReferences: "Legal references",
    legalReference: "Legal reference",
    moreInformation: (label) => `More information about ${label}`,
    requiredLabel: "Required",
    idle: "Enter your details to check this Flow",
    checking: "Checking your answers\u2026",
    ready: "Ready to complete",
    incomplete: "Complete the required fields",
    checkFailed: "Could not check this Flow. Try again.",
    creating: "Creating the verified record\u2026",
    submit: "Submit",
    submitting: "Submitting\u2026",
    privacy: "Checked by ProseID. Sent only when you submit.",
    privacyWhiteLabel: "Checked securely. Sent only when you submit.",
    completeTitle: "Submission complete.",
    delivered: (publisher) => `Your responses were verified and delivered to ${publisher}.`,
    auditRecord: (id) => `Audit record ${id}`,
    testCompleteTitle: "Test complete.",
    testDelivered: "The integration works. No record was saved or billed.",
    testRecord: (id) => `Test reference ${id}`,
    receiptTitle: "Want a copy for your records?",
    receiptHelp: "We\u2019ll email you a co-branded PDF of exactly what you submitted.",
    receiptLabel: "Email address",
    receiptPlaceholder: "you@example.com",
    receiptAction: "Email me",
    receiptSending: "Sending\u2026",
    receiptSent: (email) => `A copy is on its way to ${email}.`,
    receiptInvalid: "Enter a valid email address.",
    receiptError: "The copy could not be sent. Check the email and try again.",
    receiptRateLimited: "Too many email attempts. Wait a few minutes and try again.",
    receiptTest: "Email copies are not sent in test mode.",
    basicSignature: "Basic electronic signature",
    signatureTitle: "Sign and submit",
    signatureHelp: "Type your full legal name and confirm your intent before this record is completed.",
    signatureName: "Full legal name",
    signaturePlaceholder: "Your full legal name",
    signatureAcknowledgement: "I intend to sign this completion by typing my name. I understand this is a basic electronic signature, not a qualified electronic signature; its legal effect depends on the document, intent, and applicable law.",
    signatureNameError: "Enter at least two characters for your full legal name.",
    signatureAcknowledgementError: "Confirm that you intend to sign before continuing.",
    signAndSubmit: "Sign & submit",
    cancel: "Cancel",
    awaitingSignature: "Waiting for your signature\u2026",
    formUnavailable: "Flow unavailable",
    guidedProgress: (current, total) => `Question ${current} of ${total}`,
    guidedPath: "Decision path",
    guidedCurrent: "Current question",
    guidedRemaining: (count) => `${count} remaining`,
    guidedUpdated: "Updated from your answers",
    back: "Back",
    continue: "Continue",
    reviewAnswers: "Review answers",
    finalCheck: "Final check",
    reviewTitle: "Review your answers",
    reviewHelp: "Nothing is sent until you confirm. Return to any answer if something needs changing.",
    changeAnswer: "Change",
    notAnswered: "Not answered",
    calculatedOutcome: "Calculated outcome",
    completeAssessment: "Complete assessment",
    determinationFacts: "Facts",
    determinationTitle: "Enter what is known",
    determinationHelp: "ProseID applies the released legal logic to these facts.",
    calculate: "Calculate determination",
    calculating: "Calculating\u2026",
    calculateAgain: "Calculate again",
    determinationResult: "Determination",
    determinationWaiting: "Complete the facts, then calculate the outcome.",
    confirmDetermination: "Confirm determination",
    checklistTitle: "Review every control",
    checklistHelp: "Work through the checks below. Nothing is recorded until the whole checklist is complete.",
    checklistProgress: (reviewed, total) => `${reviewed} of ${total} controls reviewed`,
    checklistContext: "Context",
    checklistControls: "Required review",
    checklistChoose: "Choose Yes or No before completing the checklist.",
    yes: "Yes",
    no: "No",
    completeChecklist: "Complete checklist",
    required: (label) => `${label} is required.`,
    confirm: "Please confirm to continue.",
    format: (label) => `${label} isn\u2019t in the expected format.`,
    validValue: "Please enter a valid value.",
    tooShort: "This is too short.",
    tooLong: "This is too long.",
    checkValue: "Please check this value."
  },
  sv: {
    verifiedPublisher: "\u2713 Verifierad utgivare",
    verifiedBy: "Verifierat av",
    select: "V\xE4lj\u2026",
    schemaDetails: "Schemadetaljer",
    jurisdictions: "G\xE4ller i",
    legalReferences: "R\xE4ttsliga h\xE4nvisningar",
    legalReference: "R\xE4ttslig h\xE4nvisning",
    moreInformation: (label) => `Mer information om ${label}`,
    requiredLabel: "Obligatoriskt",
    idle: "Fyll i uppgifterna f\xF6r att kontrollera fl\xF6det",
    checking: "Kontrollerar dina svar\u2026",
    ready: "Redo att skicka",
    incomplete: "Fyll i de obligatoriska f\xE4lten",
    checkFailed: "Fl\xF6det kunde inte kontrolleras. F\xF6rs\xF6k igen.",
    creating: "Skapar den verifierade posten\u2026",
    submit: "Skicka",
    submitting: "Skickar\u2026",
    privacy: "Kontrolleras av ProseID. Skickas f\xF6rst n\xE4r du v\xE4ljer Skicka.",
    privacyWhiteLabel: "Kontrolleras s\xE4kert. Skickas f\xF6rst n\xE4r du v\xE4ljer Skicka.",
    completeTitle: "Inskickat.",
    delivered: (publisher) => `Dina svar verifierades och levererades till ${publisher}.`,
    auditRecord: (id) => `Revisionspost ${id}`,
    testCompleteTitle: "Testet \xE4r klart.",
    testDelivered: "Integrationen fungerar. Ingen post sparades eller debiterades.",
    testRecord: (id) => `Testreferens ${id}`,
    receiptTitle: "Vill du ha en kopia?",
    receiptHelp: "Vi mejlar en samprofilerad PDF med exakt det du skickade in.",
    receiptLabel: "E-postadress",
    receiptPlaceholder: "du@exempel.se",
    receiptAction: "Mejla mig",
    receiptSending: "Skickar\u2026",
    receiptSent: (email) => `En kopia \xE4r p\xE5 v\xE4g till ${email}.`,
    receiptInvalid: "Ange en giltig e-postadress.",
    receiptError: "Kopian kunde inte skickas. Kontrollera adressen och f\xF6rs\xF6k igen.",
    receiptRateLimited: "F\xF6r m\xE5nga mejlf\xF6rs\xF6k. V\xE4nta n\xE5gra minuter och f\xF6rs\xF6k igen.",
    receiptTest: "E-postkopior skickas inte i testl\xE4get.",
    basicSignature: "Enkel elektronisk signatur",
    signatureTitle: "Signera och skicka",
    signatureHelp: "Skriv ditt fullst\xE4ndiga juridiska namn och bekr\xE4fta din avsikt innan posten slutf\xF6rs.",
    signatureName: "Fullst\xE4ndigt juridiskt namn",
    signaturePlaceholder: "Ditt fullst\xE4ndiga juridiska namn",
    signatureAcknowledgement: "Jag avser att signera denna inl\xE4mning genom att skriva mitt namn. Jag f\xF6rst\xE5r att detta \xE4r en enkel elektronisk signatur, inte en kvalificerad elektronisk signatur, och att dess r\xE4ttsverkan beror p\xE5 dokumentet, avsikten och till\xE4mplig lag.",
    signatureNameError: "Ange minst tv\xE5 tecken f\xF6r ditt fullst\xE4ndiga juridiska namn.",
    signatureAcknowledgementError: "Bekr\xE4fta att du avser att signera innan du forts\xE4tter.",
    signAndSubmit: "Signera och skicka",
    cancel: "Avbryt",
    awaitingSignature: "V\xE4ntar p\xE5 din signatur\u2026",
    formUnavailable: "Fl\xF6det \xE4r inte tillg\xE4ngligt",
    guidedProgress: (current, total) => `Fr\xE5ga ${current} av ${total}`,
    guidedPath: "Beslutsv\xE4g",
    guidedCurrent: "Aktuell fr\xE5ga",
    guidedRemaining: (count) => `${count} \xE5terst\xE5r`,
    guidedUpdated: "Uppdateras utifr\xE5n dina svar",
    back: "Tillbaka",
    continue: "Forts\xE4tt",
    reviewAnswers: "Granska svaren",
    finalCheck: "Slutlig kontroll",
    reviewTitle: "Granska dina svar",
    reviewHelp: "Inget skickas f\xF6rr\xE4n du bekr\xE4ftar. G\xE5 tillbaka om n\xE5got beh\xF6ver \xE4ndras.",
    changeAnswer: "\xC4ndra",
    notAnswered: "Inte besvarat",
    calculatedOutcome: "Ber\xE4knat resultat",
    completeAssessment: "Slutf\xF6r bed\xF6mningen",
    determinationFacts: "Fakta",
    determinationTitle: "Ange det som \xE4r k\xE4nt",
    determinationHelp: "ProseID till\xE4mpar den publicerade juridiska logiken p\xE5 dessa fakta.",
    calculate: "Ber\xE4kna avg\xF6randet",
    calculating: "Ber\xE4knar\u2026",
    calculateAgain: "Ber\xE4kna igen",
    determinationResult: "Avg\xF6rande",
    determinationWaiting: "Fyll i fakta och ber\xE4kna sedan resultatet.",
    confirmDetermination: "Bekr\xE4fta avg\xF6randet",
    checklistTitle: "Granska varje kontroll",
    checklistHelp: "G\xE5 igenom kontrollerna nedan. Inget registreras f\xF6rr\xE4n hela checklistan \xE4r klar.",
    checklistProgress: (reviewed, total) => `${reviewed} av ${total} kontroller granskade`,
    checklistContext: "Sammanhang",
    checklistControls: "Obligatorisk granskning",
    checklistChoose: "V\xE4lj Ja eller Nej innan checklistan slutf\xF6rs.",
    yes: "Ja",
    no: "Nej",
    completeChecklist: "Slutf\xF6r checklistan",
    required: (label) => `${label} \xE4r obligatoriskt.`,
    confirm: "Bekr\xE4fta f\xF6r att forts\xE4tta.",
    format: (label) => `${label} har inte r\xE4tt format.`,
    validValue: "Ange ett giltigt v\xE4rde.",
    tooShort: "V\xE4rdet \xE4r f\xF6r kort.",
    tooLong: "V\xE4rdet \xE4r f\xF6r l\xE5ngt.",
    checkValue: "Kontrollera v\xE4rdet."
  }
};
function messagesFor(locale = "en", overrides = {}) {
  const language = String(locale).toLowerCase().split("-")[0];
  return { ...dictionaries[language] ?? dictionaries.en, ...overrides };
}

// src/themes.js
var THEMES = Object.freeze({
  light: Object.freeze({
    accent: "#ff4d1f",
    accentInk: "#b82d0d",
    canvas: "#f5f6f5",
    surface: "#ffffff",
    ink: "#171918",
    copy: "#515653",
    muted: "#6c726e",
    rule: "#dfe2df",
    success: "#167653",
    successTint: "#e8f5ef",
    submitInk: "#171918",
    skeletonGlow: "#ffffff",
    colorScheme: "light"
  }),
  charcoal: Object.freeze({
    accent: "#ff4d1f",
    accentInk: "#ff9a7a",
    canvas: "#171b1c",
    surface: "#202526",
    ink: "#f4f6f5",
    copy: "#c4cbc7",
    muted: "#a2aba6",
    rule: "#3b4340",
    success: "#71d6aa",
    successTint: "#173a2e",
    submitInk: "#24120d",
    skeletonGlow: "#2c3331",
    colorScheme: "dark"
  }),
  midnight: Object.freeze({
    accent: "#ff4d1f",
    accentInk: "#ff9a7e",
    canvas: "#111827",
    surface: "#182235",
    ink: "#f4f6fa",
    copy: "#cbd3e1",
    muted: "#a6b0c1",
    rule: "#344057",
    success: "#78d9b5",
    successTint: "#143b32",
    submitInk: "#24120d",
    skeletonGlow: "#24314a",
    colorScheme: "dark"
  }),
  forest: Object.freeze({
    accent: "#ff4d1f",
    accentInk: "#ff9a7e",
    canvas: "#151c1a",
    surface: "#1e2825",
    ink: "#f5f7f2",
    copy: "#cbd2cb",
    muted: "#a9b2ac",
    rule: "#3b4943",
    success: "#7fd7aa",
    successTint: "#173a2c",
    submitInk: "#24120d",
    skeletonGlow: "#2b3834",
    colorScheme: "dark"
  })
});
var THEME_NAMES = Object.freeze(Object.keys(THEMES));
function normalizeTheme(value) {
  return typeof value === "string" && Object.hasOwn(THEMES, value) ? value : "light";
}

// src/ProseIDForm.js
var text = (tag, className, value = "") => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value;
  return node;
};
var friendlyIssue = (issue, label, copy) => {
  switch (issue?.kind) {
    case "missing_required":
      return copy.required(label);
    case "attestation_incomplete":
      return copy.confirm;
    case "type_mismatch":
      return copy.format(label);
    case "constraint_violation":
      if (/pattern/i.test(issue.message || "")) return copy.validValue;
      if (/too short|minimum .* character/i.test(issue.message || "")) return copy.tooShort;
      if (/too long|maximum .* character/i.test(issue.message || "")) return copy.tooLong;
      return issue.message || copy.checkValue;
    default:
      return issue?.message || copy.checkValue;
  }
};
var randomRecordId = () => `embed_${globalThis.crypto?.randomUUID?.().replaceAll("-", "") || Math.random().toString(36).slice(2).padEnd(16, "0")}`;
var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
var FLOW_TYPES = /* @__PURE__ */ new Set(["form", "guided_assessment", "determination", "checklist"]);
var jurisdictionName = (value, locale = "en") => {
  const code = String(value || "").trim().toUpperCase();
  const language = String(locale || "en").toLowerCase().split("-")[0];
  const supranational = language === "sv" ? { GLOBAL: "Globalt", EU: "Europeiska unionen", EEA: "Europeiska ekonomiska samarbetsomr\xE5det" } : { GLOBAL: "Global", EU: "European Union", EEA: "European Economic Area" };
  if (supranational[code]) return supranational[code];
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
};
var ProseIDForm = class {
  constructor(target, options) {
    this.target = typeof target === "string" ? document.querySelector(target) : target;
    if (!(this.target instanceof Element)) throw new ProseIDError("invalid_target", "Choose an element to contain the ProseID form.");
    if (!options?.flow && !options?.testMode) throw new ProseIDError("invalid_flow", "The Flow coordinate is required.");
    if (!options?.apiKey) throw new ProseIDError("invalid_api_key", "A ProseID publishable key is required.");
    this.options = options;
    this.copy = messagesFor(options.locale, options.messages);
    this.attribution = normalizeAttribution(options.branding?.proseid);
    this.api = new EmbedApi({
      apiBase: options.apiBase,
      apiKey: options.apiKey,
      flow: options.flow,
      testMode: options.testMode === true,
      attribution: this.attribution,
      fetchImpl: options.fetch
    });
    this.signing = new SigningCoordinator(options.signingAdapter);
    this.shadow = this.target.shadowRoot || this.target.attachShadow({ mode: "open" });
    this.values = {};
    this.fields = /* @__PURE__ */ new Map();
    this.blurred = /* @__PURE__ */ new Set();
    this.reviewed = /* @__PURE__ */ new Set();
    this.submittedAttempted = false;
    this.valid = false;
    this.calculated = false;
    this.guidedPhase = "questions";
    this.guidedIndex = 0;
    this.guidedChecking = false;
    this.destroyed = false;
    this.validationTimer = null;
    this.validationAbort = null;
    this.cleanupFns = [];
    this.recordId = randomRecordId();
    this.applyAppearance(options.appearance);
    this.applyTheme(options.theme);
    this.renderLoading();
    this.ready = this.load();
  }
  applyTheme(theme = {}) {
    const name = normalizeTheme(theme);
    this.target.dataset.proseidTheme = name;
    for (const [key, value] of Object.entries(THEMES[name])) {
      const token = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      this.target.style.setProperty(`--proseid-${token}`, value);
    }
  }
  applyAppearance(appearance) {
    const value = normalizeAppearance(appearance);
    this.target.dataset.proseidShape = value.shape;
    this.target.dataset.proseidFields = value.fields;
    this.target.dataset.proseidShell = value.shell;
    this.target.dataset.proseidDensity = value.density;
  }
  installStyles() {
    if ("adoptedStyleSheets" in this.shadow && typeof CSSStyleSheet !== "undefined" && CSSStyleSheet.prototype.replaceSync) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(styles);
      this.shadow.adoptedStyleSheets = [sheet];
    } else {
      const style = document.createElement("style");
      if (this.options.nonce) style.setAttribute("nonce", this.options.nonce);
      style.textContent = styles;
      this.shadow.append(style);
    }
  }
  renderLoading() {
    this.shadow.replaceChildren();
    this.installStyles();
    const shell = text("div", "shell");
    const skeleton = text("div", "skeleton");
    for (let i = 0; i < 6; i++) skeleton.append(text("div", "skeleton-line"));
    shell.append(text("div", "ledger"), skeleton);
    this.shadow.append(shell);
  }
  async load() {
    try {
      this.manifest = await this.api.manifest();
      if (this.destroyed) return this;
      this.flowType = this.manifest.flow?.flowType || "form";
      if (!FLOW_TYPES.has(this.flowType)) {
        throw new ProseIDError(
          "flow_type_not_supported",
          `This version of the JavaScript SDK cannot render the \u201C${this.flowType}\u201D Flow experience.`
        );
      }
      this.attribution = normalizeAttribution(this.manifest.presentation?.attribution ?? this.attribution);
      this.api.setAttribution(this.attribution);
      this.applyTheme(this.manifest.presentation?.theme ?? this.options.theme);
      if (this.manifest.capabilities?.signing?.requested && !this.manifest.capabilities.signing.available) {
        throw new ProseIDError("signing_not_available", "Signing is not available in this embedded Flow yet.");
      }
      this.seedValues();
      this.renderForm();
      this.emit("ready", { manifest: this.manifest });
      await this.validate();
      return this;
    } catch (error) {
      this.renderFatal(error);
      this.emit("error", { error });
      throw error;
    }
  }
  seedValues() {
    for (const [name, definition] of Object.entries(this.manifest.schema?.definitions || {})) {
      this.values[name] = definition?.value ?? (["boolean", "attestation"].includes(definition?.type) ? false : "");
    }
  }
  brand(publisher) {
    const wrap = text("div", "brand");
    const customLogo = safeLogoUrl(this.options.branding?.logoUrl);
    const logo = customLogo || safeLogoUrl(publisher.logo);
    if (logo) {
      const img = document.createElement("img");
      img.src = logo;
      img.alt = this.options.branding?.logoAlt || `${publisher.name} logo`;
      wrap.append(img);
    } else {
      wrap.append(text("span", "brand-fallback", publisher.name.slice(0, 2).toUpperCase()));
    }
    const copy = text("div", "brand-copy");
    copy.append(text("div", "brand-name", publisher.name));
    copy.append(text("div", `brand-note${publisher.verified ? " verified" : ""}`, publisher.verified ? this.copy.verifiedPublisher : `@${publisher.slug}`));
    wrap.append(copy);
    return wrap;
  }
  proseidBrand() {
    if (this.attribution === "hidden") return null;
    const brand = this.manifest.branding.proseid;
    const link = text("a", `proseid-brand${this.attribution === "compact" ? " compact" : ""}`);
    link.href = brand.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `${this.copy.verifiedBy} ProseID`);
    const img = document.createElement("img");
    img.src = brand.logo;
    img.alt = "ProseID";
    if (this.attribution === "full") link.append(text("span", "", this.copy.verifiedBy));
    link.append(img);
    return link;
  }
  renderSchemaDetails() {
    const metadata = this.manifest.schema?.metadata || {};
    const description = String(metadata.description || "").trim();
    const jurisdictions = Array.isArray(metadata.jurisdictions) ? metadata.jurisdictions.filter(Boolean) : [];
    const references = Array.isArray(metadata.legal_references) ? metadata.legal_references.filter(Boolean) : [];
    if (!description && jurisdictions.length === 0 && references.length === 0) return null;
    const details = text("details", "schema-details");
    details.append(text("summary", "", this.copy.schemaDetails));
    const content = text("div", "schema-details-content");
    if (description && description !== this.manifest.flow.description) {
      content.append(text("p", "schema-summary", description));
    }
    if (jurisdictions.length) {
      const group = text("div", "metadata-group");
      group.append(text("div", "metadata-label", this.copy.jurisdictions));
      const values = text("div", "jurisdiction-list");
      for (const jurisdiction of jurisdictions) {
        const code = String(jurisdiction).toUpperCase();
        const chip = text("span", "jurisdiction", jurisdictionName(code, this.options.locale));
        chip.append(text("code", "", code));
        values.append(chip);
      }
      group.append(values);
      content.append(group);
    }
    if (references.length) {
      const group = text("div", "metadata-group");
      group.append(text("div", "metadata-label", this.copy.legalReferences));
      const list = text("ul", "reference-list");
      for (const reference of references) {
        const item = document.createElement("li");
        const label = [reference.instrument, reference.provision].filter(Boolean).join(" \xB7 ") || this.copy.legalReference;
        const source = safeLogoUrl(reference.source_url);
        if (source) {
          const link = text("a", "", label);
          link.href = source;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          item.append(link);
        } else item.textContent = label;
        list.append(item);
      }
      group.append(list);
      content.append(group);
    }
    details.append(content);
    return details;
  }
  renderForm() {
    this.shadow.replaceChildren();
    this.installStyles();
    const shell = text("section", "shell");
    shell.setAttribute("aria-label", this.manifest.flow.title);
    const head = text("header", "head");
    const brands = text("div", "brands");
    brands.append(this.brand(this.manifest.publisher));
    const proseidBrand = this.proseidBrand();
    if (proseidBrand) brands.append(proseidBrand);
    else brands.classList.add("publisher-only");
    head.append(brands, text("h1", "", this.manifest.flow.title));
    if (this.manifest.flow.description) head.append(text("p", "description", this.manifest.flow.description));
    const schemaDetails = this.renderSchemaDetails();
    if (schemaDetails) head.append(schemaDetails);
    this.statusNode = text("div", "status");
    this.statusNode.dataset.state = "idle";
    this.statusNode.append(text("span", "status-dot"), text("span", "status-copy", this.copy.idle));
    head.append(this.statusNode);
    const body = text("div", "body");
    this.formError = text("div", "form-error");
    this.formError.hidden = true;
    this.formNode = document.createElement("form");
    this.formNode.noValidate = true;
    this.formNode.addEventListener("submit", (event) => this.submit(event));
    this.fieldList = text("div", "fields");
    for (const [name, definition] of Object.entries(this.manifest.schema?.definitions || {})) {
      if (definition?.readonly === true) continue;
      this.fieldList.append(this.renderField(name, definition));
    }
    this.submitButton = text("button", "submit", this.options.submitLabel || this.defaultSubmitLabel());
    this.submitButton.type = "submit";
    this.submitButton.disabled = true;
    if (this.flowType === "guided_assessment") this.formNode.append(this.renderGuided());
    else if (this.flowType === "determination") this.formNode.append(this.renderDetermination());
    else if (this.flowType === "checklist") this.formNode.append(this.renderChecklist());
    else this.formNode.append(this.fieldList, this.renderActions());
    body.append(this.formError, this.formNode);
    shell.append(text("div", "ledger"), head, body);
    this.shadow.append(shell);
  }
  defaultSubmitLabel() {
    if (this.flowType === "guided_assessment") return this.copy.completeAssessment;
    if (this.flowType === "determination") return this.copy.confirmDetermination;
    if (this.flowType === "checklist") return this.copy.completeChecklist;
    return this.copy.submit;
  }
  renderPrivacy() {
    const privacy = text("div", "privacy");
    privacy.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    privacy.append(text("span", "", this.attribution === "hidden" ? this.copy.privacyWhiteLabel : this.copy.privacy));
    return privacy;
  }
  renderActions() {
    const actions = text("div", "actions");
    actions.append(this.renderPrivacy(), this.submitButton);
    return actions;
  }
  visibleFields() {
    return [...this.fields.entries()].filter(([, field]) => field.engineVisible !== false);
  }
  displayValue(value, definition) {
    if (["boolean", "attestation"].includes(definition?.type)) return value === true ? this.copy.yes : this.copy.no;
    if (value === void 0 || value === null || value === "") return this.copy.notAnswered;
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }
  renderGuided() {
    const guided = text("div", "guided");
    this.guidedQuestion = text("section", "guided-question");
    this.guidedIndexNode = text("div", "guided-index");
    this.guidedFieldSlot = text("div", "guided-field-slot");
    const navigation = text("div", "guided-navigation");
    this.guidedBack = text("button", "secondary-action", this.copy.back);
    this.guidedBack.type = "button";
    this.guidedBack.addEventListener("click", () => this.guidedPrevious());
    this.guidedNext = text("button", "primary-action", this.copy.continue);
    this.guidedNext.type = "button";
    this.guidedNext.addEventListener("click", () => this.guidedContinue());
    navigation.append(this.guidedBack, this.guidedNext);
    this.guidedQuestion.append(this.guidedIndexNode, this.guidedFieldSlot, navigation);
    this.guidedPath = text("aside", "guided-path");
    this.guidedReview = text("section", "guided-review");
    this.guidedReview.hidden = true;
    this.guidedParking = text("div", "field-parking");
    this.guidedParking.hidden = true;
    for (const field of this.fields.values()) this.guidedParking.append(field.wrap);
    const layout = text("div", "guided-layout");
    layout.append(this.guidedPath, this.guidedQuestion, this.guidedReview, this.guidedParking);
    guided.append(layout);
    this.refreshGuided();
    return guided;
  }
  refreshGuided() {
    if (!this.guidedQuestion) return;
    const entries = this.visibleFields();
    if (!entries.length) {
      this.guidedQuestion.replaceChildren(text("p", "empty-state", "This Flow has no visible questions."));
      this.guidedPath.hidden = true;
      return;
    }
    this.guidedIndex = Math.min(this.guidedIndex, entries.length - 1);
    const [, field] = entries[this.guidedIndex];
    for (const [, candidate] of entries) {
      candidate.wrap.hidden = candidate !== field;
      if (candidate !== field && candidate.wrap.parentNode !== this.guidedParking) this.guidedParking.append(candidate.wrap);
    }
    field.wrap.hidden = false;
    this.guidedFieldSlot.replaceChildren(field.wrap);
    this.guidedIndexNode.textContent = this.copy.guidedProgress(this.guidedIndex + 1, entries.length);
    this.guidedBack.disabled = this.guidedIndex === 0;
    this.guidedNext.disabled = this.guidedChecking;
    this.guidedNext.textContent = this.guidedIndex === entries.length - 1 ? this.copy.reviewAnswers : this.copy.continue;
    this.guidedPath.replaceChildren();
    const heading = text("div", "guided-path-heading");
    heading.append(text("span", "", this.copy.guidedPath), text("strong", "", `${this.guidedIndex + 1}/${entries.length}`));
    const rail = text("div", "guided-progress");
    const fill = text("span", "");
    fill.style.width = `${Math.round((this.guidedIndex + 1) / entries.length * 100)}%`;
    rail.append(fill);
    const list = document.createElement("ol");
    entries.forEach(([entryName, entryField], index) => {
      const item = text("li", index < this.guidedIndex ? "answered" : index === this.guidedIndex ? "active" : "remaining");
      const button = text("button", "guided-path-button");
      button.type = "button";
      button.disabled = index > this.guidedIndex;
      const copy = text("span", "guided-path-copy");
      copy.append(
        text("strong", "", entryField.label),
        text("small", "", index < this.guidedIndex ? this.displayValue(this.values[entryName], entryField.definition) : index === this.guidedIndex ? this.copy.guidedCurrent : this.copy.guidedUpdated)
      );
      button.append(text("span", "guided-marker", index < this.guidedIndex ? "\u2713" : ""), copy);
      button.addEventListener("click", () => {
        this.guidedIndex = index;
        this.guidedPhase = "questions";
        this.refreshGuided();
      });
      item.append(button);
      list.append(item);
    });
    this.guidedPath.append(heading, rail, list);
  }
  async guidedContinue() {
    if (this.guidedNext.disabled) return;
    clearTimeout(this.validationTimer);
    const entries = this.visibleFields();
    const current = entries[this.guidedIndex];
    if (!current) return;
    this.blurred.add(current[0]);
    this.guidedChecking = true;
    this.guidedNext.disabled = true;
    this.guidedNext.textContent = this.copy.checking;
    const result = await this.validate();
    if (!result) {
      this.guidedChecking = false;
      this.refreshGuided();
      return;
    }
    const blocking = (result?.issues || []).some((issue) => issue.field_id === current[0] && issue.severity === "error");
    if (blocking) {
      this.guidedChecking = false;
      this.refreshGuided();
      return;
    }
    const refreshed = this.visibleFields();
    this.guidedChecking = false;
    if (this.guidedIndex < refreshed.length - 1) {
      this.guidedIndex += 1;
      this.refreshGuided();
      this.guidedFieldSlot.querySelector("input, select, textarea, button")?.focus?.();
    } else this.showGuidedReview();
  }
  guidedPrevious() {
    if (this.guidedPhase === "review") {
      this.guidedPhase = "questions";
      this.guidedReview.hidden = true;
      this.guidedQuestion.hidden = false;
      this.guidedPath.hidden = false;
      this.refreshGuided();
      return;
    }
    if (this.guidedIndex > 0) {
      this.guidedIndex -= 1;
      this.refreshGuided();
    }
  }
  showGuidedReview() {
    this.guidedPhase = "review";
    for (const field of this.fields.values()) this.guidedParking.append(field.wrap);
    this.guidedQuestion.hidden = true;
    this.guidedPath.hidden = true;
    this.guidedReview.hidden = false;
    this.guidedReview.replaceChildren();
    const head = text("header", "review-head");
    head.append(text("span", "eyebrow", this.copy.finalCheck), text("h2", "", this.copy.reviewTitle), text("p", "", this.copy.reviewHelp));
    const list = text("div", "review-list");
    this.visibleFields().forEach(([name, field], index) => {
      const row = text("div", "review-row");
      const answer = text("span", "review-answer");
      answer.append(text("small", "", field.label), text("strong", "", this.displayValue(this.values[name], field.definition)));
      const change = text("button", "review-change", this.copy.changeAnswer);
      change.type = "button";
      change.addEventListener("click", () => {
        this.guidedIndex = index;
        this.guidedPrevious();
      });
      row.append(answer, change);
      list.append(row);
    });
    const outcomes = this.renderOutcomeList(this.lastValidation?.definitions || {});
    const actions = text("div", "guided-review-actions");
    const back = text("button", "secondary-action", this.copy.back);
    back.type = "button";
    back.addEventListener("click", () => this.guidedPrevious());
    actions.append(back, this.submitButton);
    this.guidedReview.append(head, list);
    if (outcomes) this.guidedReview.append(outcomes);
    this.guidedReview.append(this.renderPrivacy(), actions);
    this.updateSubmitState();
  }
  renderDetermination() {
    const layout = text("div", "determination-layout");
    const facts = text("section", "determination-facts");
    const head = text("header", "experience-head");
    head.append(text("span", "eyebrow", this.copy.determinationFacts), text("h2", "", this.copy.determinationTitle), text("p", "", this.copy.determinationHelp));
    this.calculateButton = text("button", "primary-action", this.copy.calculate);
    this.calculateButton.type = "button";
    this.calculateButton.addEventListener("click", () => this.calculateDetermination());
    facts.append(head, this.fieldList, this.calculateButton);
    this.determinationResult = text("aside", "determination-result");
    this.renderDeterminationWaiting();
    layout.append(facts, this.determinationResult);
    const wrap = text("div", "determination");
    wrap.append(layout, this.renderActions());
    return wrap;
  }
  renderDeterminationWaiting() {
    if (!this.determinationResult) return;
    this.determinationResult.replaceChildren(
      text("span", "eyebrow", this.copy.determinationResult),
      text("h2", "", this.copy.calculatedOutcome),
      text("p", "determination-waiting", this.copy.determinationWaiting)
    );
  }
  async calculateDetermination() {
    if (this.calculateButton.disabled) return;
    clearTimeout(this.validationTimer);
    this.submittedAttempted = true;
    this.calculateButton.disabled = true;
    this.calculateButton.textContent = this.copy.calculating;
    const result = await this.validate();
    this.calculateButton.disabled = false;
    if (!result?.valid) {
      this.calculateButton.textContent = this.copy.calculate;
      return;
    }
    this.calculated = true;
    this.calculateButton.textContent = this.copy.calculateAgain;
    this.determinationResult.replaceChildren(
      text("span", "eyebrow", this.copy.determinationResult),
      text("h2", "", this.copy.calculatedOutcome)
    );
    const outcomes = this.renderOutcomeList(result.definitions || {});
    if (outcomes) this.determinationResult.append(outcomes);
    else this.determinationResult.append(text("p", "determination-waiting", this.copy.notAnswered));
    this.updateSubmitState();
  }
  renderOutcomeList(definitions) {
    const entries = Object.entries(definitions).filter(([, definition]) => definition?.readonly === true && definition?.visible !== false);
    if (!entries.length) return null;
    const list = text("div", "outcome-list");
    for (const [name, definition] of entries) {
      const item = text("article", "outcome");
      item.append(text("small", "", definition.label || name.replaceAll("_", " ")), text("strong", "", this.displayValue(definition.value, definition)));
      if (definition.ui_message) item.append(text("p", "", definition.ui_message));
      list.append(item);
    }
    return list;
  }
  renderChecklist() {
    const checklist = text("div", "checklist");
    const head = text("header", "checklist-head");
    const copy = text("div", "checklist-title");
    copy.append(text("span", "eyebrow", this.copy.checklistControls), text("h2", "", this.copy.checklistTitle), text("p", "", this.copy.checklistHelp));
    this.checklistProgress = text("div", "checklist-progress");
    head.append(copy, this.checklistProgress);
    const context = text("section", "checklist-section");
    const controls = text("section", "checklist-section checklist-controls");
    const contextFields = [];
    const controlFields = [];
    for (const [, field] of this.fields) {
      if (["boolean", "attestation"].includes(field.definition.type)) controlFields.push(field.wrap);
      else contextFields.push(field.wrap);
    }
    if (contextFields.length) {
      context.append(text("h3", "", this.copy.checklistContext));
      const grid = text("div", "checklist-context-grid");
      grid.append(...contextFields);
      context.append(grid);
    }
    controls.append(text("h3", "", this.copy.checklistControls));
    const list = text("div", "checklist-control-list");
    list.append(...controlFields);
    controls.append(list);
    checklist.append(head);
    if (contextFields.length) checklist.append(context);
    checklist.append(controls, this.renderActions());
    this.updateChecklistProgress();
    return checklist;
  }
  checklistControlNames() {
    return [...this.fields.entries()].filter(([, field]) => field.engineVisible !== false && ["boolean", "attestation"].includes(field.definition.type)).map(([name]) => name);
  }
  updateChecklistProgress() {
    if (!this.checklistProgress) return;
    const names = this.checklistControlNames();
    const reviewed = names.filter((name) => this.reviewed.has(name)).length;
    this.checklistProgress.replaceChildren(
      text("strong", "", `${reviewed}/${names.length}`),
      text("span", "", this.copy.checklistProgress(reviewed, names.length))
    );
    const rail = text("div", "checklist-progress-rail");
    const fill = text("i", "");
    fill.style.width = `${names.length ? Math.round(reviewed / names.length * 100) : 100}%`;
    rail.append(fill);
    this.checklistProgress.append(rail);
  }
  updateSubmitState() {
    if (!this.submitButton) return;
    let allowed = this.valid;
    if (this.flowType === "determination") allowed = allowed && this.calculated;
    if (this.flowType === "checklist") {
      const controls = this.checklistControlNames();
      allowed = allowed && controls.every((name) => this.reviewed.has(name));
    }
    this.submitButton.disabled = !allowed;
  }
  renderDatePicker(id, definition, labelText) {
    const wrap = text("div", "date-control");
    const input = document.createElement("input");
    input.id = id;
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.className = "control date-input";
    input.placeholder = definition.placeholder || "YYYY-MM-DD";
    const trigger = text("button", "date-trigger");
    trigger.type = "button";
    trigger.setAttribute("aria-label", `Choose date for ${labelText}`);
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 9.5h17"/></svg>';
    wrap.append(input, trigger);
    const isoParts = (value) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
      if (!match) return null;
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const date = new Date(Date.UTC(year, month - 1, day));
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? { year, month, day } : null;
    };
    const iso = (year, month, day) => `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const today = /* @__PURE__ */ new Date();
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
    const monthTitle = () => new Intl.DateTimeFormat(this.options.locale || "en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(viewYear, viewMonth - 1, 1)));
    const displayDate = (value) => {
      const parsed = isoParts(value);
      if (!parsed) return value;
      return new Intl.DateTimeFormat(this.options.locale || "en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)));
    };
    const close = ({ focus = false } = {}) => {
      panel?.remove();
      panel = null;
      trigger.setAttribute("aria-expanded", "false");
      if (focus) trigger.focus();
    };
    const choose = (value) => {
      if (!allowed(value)) return;
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      close({ focus: true });
    };
    const clear = () => {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
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
      panel.style.setProperty("--date-left", `${left}px`);
      panel.style.setProperty("--date-top", `${top}px`);
      panel.style.setProperty("--date-width", `${width}px`);
    };
    const renderPanel = () => {
      if (!panel) return;
      panel.replaceChildren();
      const header = text("header", "date-panel-head");
      const title = text("div", "date-panel-title");
      title.append(text("span", "", "Select date"), text("strong", "", monthTitle()));
      const navigation = text("nav", "date-navigation");
      navigation.setAttribute("aria-label", "Change month");
      const previous = text("button", "", "\u2039");
      previous.type = "button";
      previous.setAttribute("aria-label", "Previous month");
      const next = text("button", "", "\u203A");
      next.type = "button";
      next.setAttribute("aria-label", "Next month");
      const move = (delta) => {
        const date = new Date(Date.UTC(viewYear, viewMonth - 1 + delta, 1));
        viewYear = date.getUTCFullYear();
        viewMonth = date.getUTCMonth() + 1;
        renderPanel();
        place();
      };
      previous.addEventListener("click", () => move(-1));
      next.addEventListener("click", () => move(1));
      navigation.append(previous, next);
      header.append(title, navigation);
      const weekdays = text("div", "date-weekdays");
      for (const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) weekdays.append(text("span", "", day));
      const grid = text("div", "date-grid");
      grid.setAttribute("role", "grid");
      grid.setAttribute("aria-label", monthTitle());
      const first = new Date(Date.UTC(viewYear, viewMonth - 1, 1));
      const startOffset = (first.getUTCDay() + 6) % 7;
      for (let index = 0; index < 42; index += 1) {
        const date = new Date(Date.UTC(viewYear, viewMonth - 1, index - startOffset + 1));
        const value = iso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
        const day = text("button", date.getUTCMonth() + 1 === viewMonth ? "" : "outside", String(date.getUTCDate()));
        day.type = "button";
        day.setAttribute("role", "gridcell");
        day.setAttribute("aria-label", displayDate(value));
        day.setAttribute("aria-selected", String(input.value === value));
        if (input.value === value) day.classList.add("selected");
        if (todayIso === value) day.classList.add("today");
        day.disabled = !allowed(value);
        day.addEventListener("click", () => choose(value));
        grid.append(day);
      }
      const footer = text("footer", "date-panel-footer");
      const clearButton = text("button", "", "Clear");
      clearButton.type = "button";
      clearButton.disabled = !input.value;
      clearButton.addEventListener("click", clear);
      const todayButton = text("button", "today-action", "Today");
      todayButton.type = "button";
      todayButton.disabled = !allowed(todayIso);
      todayButton.addEventListener("click", () => choose(todayIso));
      footer.append(clearButton, todayButton);
      panel.append(header, weekdays, grid, footer);
    };
    const open = () => {
      if (panel) return close();
      anchor = isoParts(input.value) || isoParts(todayIso);
      viewYear = anchor.year;
      viewMonth = anchor.month;
      panel = text("section", "date-panel");
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-label", `Choose date for ${labelText}`);
      this.shadow.append(panel);
      trigger.setAttribute("aria-expanded", "true");
      renderPanel();
      place();
      panel.querySelector('[aria-selected="true"]:not(:disabled), .today:not(:disabled), button:not(:disabled)')?.focus?.();
    };
    trigger.addEventListener("click", open);
    const outside = (event) => {
      const path = event.composedPath?.() || [];
      if (panel && !path.includes(panel) && !path.includes(wrap)) close();
    };
    const escape = (event) => {
      if (panel && event.key === "Escape") {
        event.preventDefault();
        close({ focus: true });
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    this.cleanupFns.push(() => {
      close();
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    });
    return { input, wrap };
  }
  renderField(name, definition) {
    const wrap = text("div", "field");
    wrap.dataset.fieldName = name;
    wrap.hidden = definition.visible === false;
    const labelText = definition.label || definition.statement || name.replaceAll("_", " ");
    const id = `proseid-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    let control;
    const required = text("span", "required", this.copy.requiredLabel);
    required.hidden = definition.required !== true;
    const infoId = `${id}-info`;
    const messageId = `${id}-message`;
    const hintId = `${id}-hint`;
    let info = null;
    if (definition.info) {
      info = text("span", "info-tip");
      const trigger = text("button", "info-trigger", "i");
      trigger.type = "button";
      trigger.setAttribute("aria-label", this.copy.moreInformation(labelText));
      trigger.setAttribute("aria-describedby", infoId);
      const popover = text("span", "info-popover", definition.info);
      popover.id = infoId;
      popover.setAttribute("role", "tooltip");
      info.append(trigger, popover);
    }
    if (this.flowType === "checklist" && definition.type === "boolean") {
      control = document.createElement("input");
      control.type = "hidden";
      control.value = String(Boolean(this.values[name]));
      const row = text("div", "checklist-boolean");
      const copy = text("div", "checklist-boolean-copy");
      const label = text("span", "label", definition.statement || labelText);
      label.id = `${id}-label`;
      copy.append(label, required);
      if (info) copy.append(info);
      const choices = text("div", "boolean-choice");
      choices.setAttribute("role", "group");
      choices.setAttribute("aria-labelledby", label.id);
      const yes = text("button", "", this.copy.yes);
      const no = text("button", "", this.copy.no);
      yes.type = no.type = "button";
      yes.setAttribute("aria-pressed", "false");
      no.setAttribute("aria-pressed", "false");
      yes.addEventListener("click", () => this.setChecklistBoolean(name, true));
      no.addEventListener("click", () => this.setChecklistBoolean(name, false));
      choices.append(yes, no);
      row.append(copy, choices);
      wrap.append(row);
      wrap.choiceButtons = { yes, no };
    } else if (["boolean", "attestation"].includes(definition.type)) {
      const label = text("label", "check");
      control = document.createElement("input");
      control.type = "checkbox";
      control.checked = Boolean(this.values[name]);
      control.setAttribute("role", "switch");
      const track = text("span", "toggle-track");
      track.setAttribute("aria-hidden", "true");
      const copy = text("span", "check-copy", definition.statement || labelText);
      copy.append(required);
      label.append(control, track, copy);
      const row = text("div", "check-row");
      row.append(label);
      if (info) row.append(info);
      wrap.append(row);
    } else {
      const label = text("label", "label", labelText);
      label.htmlFor = id;
      label.append(required);
      const row = text("div", "label-row");
      row.append(label);
      if (info) row.append(info);
      wrap.append(row);
      if (definition.type === "select") {
        control = document.createElement("select");
        const empty = text("option", "", definition.placeholder || this.copy.select);
        empty.value = "";
        control.append(empty);
        for (const option of definition.options || []) {
          const value = typeof option === "object" ? option.value : option;
          const item = text("option", "", typeof option === "object" ? option.label || value : value);
          item.value = value;
          control.append(item);
        }
      } else if (definition.type === "date") {
        const datePicker = this.renderDatePicker(id, definition, labelText);
        control = datePicker.input;
        wrap.append(datePicker.wrap);
      } else if (definition.multiline) {
        control = document.createElement("textarea");
      } else {
        control = document.createElement("input");
        control.type = ["number", "currency"].includes(definition.type) ? "number" : definition.format === "email" ? "email" : "text";
        if (definition.type === "currency") control.step = "0.01";
      }
      control.id = id;
      control.className = definition.type === "date" ? "control date-input" : "control";
      control.value = this.values[name] ?? "";
      if (definition.placeholder && definition.type !== "select") control.placeholder = definition.placeholder;
      if (definition.min != null) control.min = definition.min;
      if (definition.max != null) control.max = definition.max;
      if (definition.min_length != null) control.minLength = definition.min_length;
      if (definition.max_length != null) control.maxLength = definition.max_length;
      if (definition.pattern) control.pattern = definition.pattern;
      if (definition.type !== "date") wrap.append(control);
      if (definition.description || definition.help) {
        const hint = text("span", "hint", definition.description || definition.help);
        hint.id = hintId;
        wrap.append(hint);
      }
    }
    control.name = name;
    control.required = definition.required === true;
    const message = text("span", "field-message", definition.ui_message || "");
    message.id = messageId;
    message.hidden = !definition.ui_message;
    wrap.append(message);
    const describedBy = [definition.info ? infoId : "", definition.description || definition.help ? hintId : "", messageId, `${id}-error`].filter(Boolean);
    control.setAttribute("aria-describedby", describedBy.join(" "));
    control.addEventListener("input", () => this.change(name, definition, control));
    control.addEventListener("change", () => this.change(name, definition, control, true));
    control.addEventListener("blur", () => {
      this.blurred.add(name);
      this.scheduleValidation(120);
    });
    const error = text("span", "error");
    error.id = `${id}-error`;
    error.setAttribute("aria-live", "polite");
    wrap.append(error);
    this.fields.set(name, {
      wrap,
      control,
      error,
      message,
      required,
      definition,
      label: labelText,
      engineVisible: definition.visible !== false,
      choiceButtons: wrap.choiceButtons || null
    });
    return wrap;
  }
  setChecklistBoolean(name, value) {
    const field = this.fields.get(name);
    if (!field) return;
    const firstReview = !this.reviewed.has(name);
    this.reviewed.add(name);
    field.control.value = String(value);
    field.choiceButtons?.yes.classList.toggle("selected", value === true);
    field.choiceButtons?.no.classList.toggle("selected", value === false);
    field.choiceButtons?.yes.setAttribute("aria-pressed", String(value === true));
    field.choiceButtons?.no.setAttribute("aria-pressed", String(value === false));
    this.updateChecklistProgress();
    if (Object.is(this.values[name], value)) {
      this.updateSubmitState();
      if (firstReview) {
        this.emit("change", { name, value, values: { ...this.values } });
        this.scheduleValidation(0);
      }
      return;
    }
    this.values[name] = value;
    this.valid = false;
    this.updateSubmitState();
    this.setStatus("checking", this.copy.checking);
    this.emit("change", { name, value, values: { ...this.values } });
    this.scheduleValidation(0);
  }
  change(name, definition, control, immediate = false) {
    const value = ["boolean", "attestation"].includes(definition.type) ? control.checked : ["number", "currency"].includes(definition.type) && control.value !== "" ? Number(control.value) : control.value;
    if (this.flowType === "checklist" && ["boolean", "attestation"].includes(definition.type)) {
      this.reviewed.add(name);
      this.updateChecklistProgress();
    }
    if (Object.is(this.values[name], value)) {
      this.updateSubmitState();
      return;
    }
    this.values[name] = value;
    this.valid = false;
    if (this.flowType === "determination") {
      this.calculated = false;
      if (this.calculateButton) this.calculateButton.textContent = this.copy.calculate;
      this.renderDeterminationWaiting();
    }
    this.updateSubmitState();
    this.setStatus("checking", this.copy.checking);
    this.emit("change", { name, value: this.values[name], values: { ...this.values } });
    this.scheduleValidation(immediate ? 0 : this.options.validateDelay ?? 400);
  }
  scheduleValidation(delay) {
    clearTimeout(this.validationTimer);
    this.validationTimer = setTimeout(() => this.validate(), Math.max(0, delay));
  }
  async validate() {
    if (this.destroyed || !this.manifest) return null;
    this.validationAbort?.abort();
    this.validationAbort = new AbortController();
    this.setStatus("checking", this.copy.checking);
    try {
      const result = await this.api.validate(this.manifest.flow.ref, this.values, this.validationAbort.signal);
      this.lastValidation = result;
      this.valid = result.valid === true;
      this.applyDefinitions(result.definitions || {});
      this.renderIssues(result.issues || []);
      this.updateSubmitState();
      this.setStatus(this.valid ? "ready" : "idle", this.valid ? this.copy.ready : this.copy.incomplete);
      this.emit("validation", { valid: this.valid, status: result.status, issues: result.issues || [] });
      return result;
    } catch (error) {
      if (error?.name === "AbortError") return null;
      this.valid = false;
      this.updateSubmitState();
      this.setStatus("error", this.copy.checkFailed);
      this.emit("error", { error });
      return null;
    }
  }
  applyDefinitions(definitions) {
    for (const [name, resolved] of Object.entries(definitions)) {
      const field = this.fields.get(name);
      if (!field) continue;
      field.engineVisible = resolved?.visible !== false;
      field.definition = { ...field.definition, ...resolved };
      field.wrap.hidden = !field.engineVisible;
      const required = resolved?.required === true;
      field.control.required = required;
      field.required.hidden = !required;
      field.message.textContent = resolved?.ui_message || "";
      field.message.hidden = !resolved?.ui_message;
    }
    if (this.flowType === "guided_assessment" && this.guidedPhase === "questions") this.refreshGuided();
    if (this.flowType === "checklist") this.updateChecklistProgress();
  }
  shouldShow(issue) {
    if (this.submittedAttempted) return true;
    if (issue?.trigger === "completion") return false;
    if (issue?.trigger === "correction") return this.blurred.has(issue.field_id);
    return issue?.severity === "warning" || issue?.severity === "notice";
  }
  renderIssues(issues) {
    for (const field of this.fields.values()) {
      field.error.textContent = "";
      field.control.setAttribute("aria-invalid", "false");
    }
    const formIssues = [];
    for (const issue of issues) {
      if (!this.shouldShow(issue)) continue;
      const field = this.fields.get(issue.field_id);
      if (field) {
        field.error.textContent = friendlyIssue(issue, field.label, this.copy);
        field.control.setAttribute("aria-invalid", "true");
      } else formIssues.push(friendlyIssue(issue, "This field", this.copy));
    }
    if (this.submittedAttempted && this.flowType === "checklist") {
      for (const name of this.checklistControlNames()) {
        if (this.reviewed.has(name)) continue;
        const field = this.fields.get(name);
        if (!field || field.error.textContent) continue;
        field.error.textContent = this.copy.checklistChoose;
        field.control.setAttribute("aria-invalid", "true");
      }
    }
    this.formError.textContent = formIssues.join(" ");
    this.formError.hidden = formIssues.length === 0;
  }
  setStatus(state, copy) {
    if (!this.statusNode) return;
    this.statusNode.dataset.state = state;
    this.statusNode.querySelector(".status-copy").textContent = copy;
  }
  collectBasicSignature() {
    return new Promise((resolve) => {
      const overlay = text("div", "signature-overlay");
      const dialog = text("section", "signature-dialog");
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "proseid-signature-title");
      const eyebrow = text("div", "signature-eyebrow", this.copy.basicSignature);
      const title = text("h2", "", this.copy.signatureTitle);
      title.id = "proseid-signature-title";
      const help = text("p", "signature-help", this.copy.signatureHelp);
      const form = document.createElement("form");
      form.className = "signature-form";
      form.noValidate = true;
      const nameLabel = text("label", "signature-label", this.copy.signatureName);
      nameLabel.htmlFor = "proseid-signature-name";
      const name = document.createElement("input");
      name.id = "proseid-signature-name";
      name.className = "signature-input";
      name.type = "text";
      name.autocomplete = "name";
      name.maxLength = 160;
      name.required = true;
      name.placeholder = this.copy.signaturePlaceholder;
      const acknowledgement = text("label", "signature-acknowledgement");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.required = true;
      acknowledgement.append(checkbox, text("span", "", this.copy.signatureAcknowledgement));
      const error = text("p", "signature-error");
      error.setAttribute("role", "alert");
      const actions = text("div", "signature-actions");
      const cancel = text("button", "signature-cancel", this.copy.cancel);
      cancel.type = "button";
      const confirm = text("button", "signature-confirm", this.copy.signAndSubmit);
      confirm.type = "submit";
      actions.append(cancel, confirm);
      form.append(nameLabel, name, acknowledgement, error, actions);
      dialog.append(eyebrow, title, help, form);
      overlay.append(dialog);
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        this.signatureCancel = null;
        overlay.remove();
        resolve(value);
      };
      this.signatureCancel = () => finish(null);
      cancel.addEventListener("click", () => finish(null));
      overlay.addEventListener("keydown", (event) => {
        if (event.key === "Escape") finish(null);
      });
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const typedName = name.value.trim();
        if (typedName.length < 2 || !checkbox.checked) {
          error.textContent = typedName.length < 2 ? this.copy.signatureNameError : this.copy.signatureAcknowledgementError;
          if (typedName.length < 2) name.focus();
          else checkbox.focus();
          return;
        }
        finish({ kind: "basic", typed_name: typedName, acknowledged: true });
      });
      this.shadow.append(overlay);
      name.focus();
    });
  }
  async submit(event) {
    event.preventDefault();
    if (this.destroyed) return;
    clearTimeout(this.validationTimer);
    this.submittedAttempted = true;
    this.renderIssues(this.lastValidation?.issues || []);
    if (this.flowType === "determination" && !this.calculated) return;
    if (this.flowType === "checklist" && !this.checklistControlNames().every((name) => this.reviewed.has(name))) return;
    if (!this.valid) {
      await this.validate();
      if (!this.valid) return;
    }
    this.submitButton.disabled = true;
    this.submitButton.textContent = this.copy.submitting;
    this.setStatus("checking", this.copy.creating);
    this.emit("submit", { values: { ...this.values } });
    try {
      let signature = null;
      if (this.manifest.capabilities?.signing?.requested) {
        const mode = this.manifest.capabilities.signing.mode;
        if (mode === "basic") {
          this.setStatus("checking", this.copy.awaitingSignature);
          signature = await this.collectBasicSignature();
          if (!signature) {
            this.updateSubmitState();
            this.submitButton.textContent = this.options.submitLabel || this.defaultSubmitLabel();
            this.setStatus("ready", this.copy.ready);
            return;
          }
          this.emit("signing", { mode, signature });
        } else {
          const nextAction = await this.api.prepareSigning(this.manifest.flow.ref, this.recordId, this.values);
          signature = await this.signing.handle(nextAction, { manifest: this.manifest, values: { ...this.values } });
          this.emit("signing", { mode, nextAction, signature });
        }
      }
      const result = await this.api.complete(this.manifest.flow.ref, this.recordId, this.values, signature);
      this.renderComplete(result);
      this.emit("complete", result);
    } catch (error) {
      this.updateSubmitState();
      this.submitButton.textContent = this.options.submitLabel || this.defaultSubmitLabel();
      this.formError.hidden = false;
      this.formError.textContent = errorMessage(error.code, error.message);
      this.setStatus("error", "Submission not saved");
      this.emit("error", { error });
    }
  }
  renderComplete(result) {
    for (const cleanup of this.cleanupFns.splice(0)) cleanup();
    const shell = this.shadow.querySelector(".shell");
    const complete = text("div", "complete");
    complete.append(text("div", "seal", "\u2713"), text("h2", "", result.test ? this.copy.testCompleteTitle : this.copy.completeTitle));
    complete.append(text("p", "", result.test ? this.copy.testDelivered : this.copy.delivered(this.manifest.publisher.name)));
    complete.append(text("div", "receipt", result.test ? this.copy.testRecord(result.recordId) : this.copy.auditRecord(result.recordId)));
    if (result.test) {
      complete.append(text("p", "receipt-test", this.copy.receiptTest));
    } else if (this.manifest.capabilities?.receiptEmail !== false) {
      complete.append(this.renderReceiptEmail(result));
    }
    shell.replaceChildren(text("div", "ledger"), complete);
  }
  renderReceiptEmail(result) {
    const section = text("section", "receipt-copy");
    const title = text("h3", "", this.copy.receiptTitle);
    const help = text("p", "receipt-help", this.copy.receiptHelp);
    const form = document.createElement("form");
    form.className = "receipt-form";
    form.noValidate = true;
    const field = text("div", "receipt-field");
    const id = `proseid-receipt-${String(result.recordId).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48)}`;
    const label = text("label", "receipt-label", this.copy.receiptLabel);
    label.htmlFor = id;
    const row = text("div", "receipt-row");
    const input = document.createElement("input");
    input.id = id;
    input.className = "receipt-input";
    input.type = "email";
    input.inputMode = "email";
    input.autocomplete = "email";
    input.placeholder = this.copy.receiptPlaceholder;
    input.maxLength = 320;
    input.required = true;
    const button = text("button", "receipt-button", this.copy.receiptAction);
    button.type = "submit";
    button.disabled = true;
    const status = text("p", "receipt-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    input.setAttribute("aria-describedby", `${id}-status`);
    status.id = `${id}-status`;
    input.addEventListener("input", () => {
      button.disabled = !EMAIL_RE.test(input.value.trim());
      input.setAttribute("aria-invalid", "false");
      status.textContent = "";
      status.dataset.state = "idle";
    });
    form.addEventListener("submit", (event) => this.sendReceipt(event, { result, input, button, status }));
    row.append(input, button);
    field.append(label, row, status);
    form.append(field);
    section.append(title, help, form);
    return section;
  }
  async sendReceipt(event, { result, input, button, status }) {
    event.preventDefault();
    if (this.destroyed || result.test) return;
    const email = input.value.trim();
    if (!EMAIL_RE.test(email)) {
      input.setAttribute("aria-invalid", "true");
      status.dataset.state = "error";
      status.textContent = this.copy.receiptInvalid;
      return;
    }
    input.disabled = true;
    button.disabled = true;
    button.textContent = this.copy.receiptSending;
    status.dataset.state = "idle";
    status.textContent = "";
    try {
      await this.api.emailReceipt(this.manifest.flow.ref, result.recordId, email);
      status.dataset.state = "sent";
      status.textContent = this.copy.receiptSent(email);
      button.textContent = this.copy.receiptAction;
      this.emit("receipt", { status: "sent", recordId: result.recordId, email });
    } catch (error) {
      input.disabled = false;
      button.disabled = false;
      button.textContent = this.copy.receiptAction;
      status.dataset.state = "error";
      status.textContent = error?.code === "rate_limited" ? this.copy.receiptRateLimited : this.copy.receiptError;
      this.emit("receipt", { status: "error", recordId: result.recordId, email, error });
    }
  }
  renderFatal(error) {
    this.shadow.replaceChildren();
    this.installStyles();
    const shell = text("section", "shell");
    const complete = text("div", "complete");
    complete.append(text("div", "seal", "!"), text("h2", "", this.copy.formUnavailable));
    complete.append(text("p", "", errorMessage(error?.code, error?.message)));
    shell.append(text("div", "ledger"), complete);
    this.shadow.append(shell);
  }
  emit(name, detail) {
    this.target.dispatchEvent(new CustomEvent(`proseid:${name}`, { detail, bubbles: true, composed: true }));
    const callback = this.options[`on${name[0].toUpperCase()}${name.slice(1)}`];
    if (typeof callback === "function") callback(name === "error" ? detail.error : detail);
  }
  destroy() {
    this.destroyed = true;
    clearTimeout(this.validationTimer);
    this.validationAbort?.abort();
    this.signatureCancel?.();
    for (const cleanup of this.cleanupFns.splice(0)) cleanup();
    this.shadow.replaceChildren();
    this.fields.clear();
  }
};

// src/index.js
function mount(target, options) {
  return new ProseIDForm(target, options);
}
function mountTest(target, options) {
  return new ProseIDForm(target, { ...options, testMode: true });
}
function mountAll(defaults = {}) {
  return [...document.querySelectorAll("[data-proseid-flow]")].map((element) => mount(element, {
    ...defaults,
    flow: element.getAttribute("data-proseid-flow"),
    apiKey: element.getAttribute("data-proseid-key") || defaults.apiKey,
    apiBase: element.getAttribute("data-proseid-api") || defaults.apiBase
  }));
}
export {
  ProseIDError,
  ProseIDForm,
  THEME_NAMES,
  VERSION,
  mount,
  mountAll,
  mountTest
};
//# sourceMappingURL=proseid.js.map
