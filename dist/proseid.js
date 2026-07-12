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
  publishable_key_required: "This form is missing its ProseID publishable key.",
  invalid_publishable_key: "This form is using an invalid or revoked ProseID key.",
  form_not_allowed: "This form is not available for this ProseID key.",
  embed_origin_not_allowed: "This website is not allowed to use this form.",
  form_not_found: "This form is no longer available.",
  form_unpublished: "This form is no longer available.",
  insufficient_balance: "This form is temporarily unavailable. Contact its publisher.",
  rate_limited: "Too many requests. Wait a moment and try again.",
  validation_failed: "Check the highlighted fields and try again.",
  signing_not_available: "Signing is not available in embedded forms yet.",
  service_unavailable: "Validation is temporarily unavailable. Try again shortly."
};
function errorMessage(code, fallback = "") {
  return messages[code] || fallback || "The request could not be completed.";
}

// src/version.js
var VERSION = "0.4.0";

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
function parseFormCoordinate(value) {
  const parts = String(value ?? "").split("/").filter(Boolean);
  if (parts.length !== 2) throw new ProseIDError("invalid_form", 'Form must be "publisher/slug".');
  return { publisher: parts[0], slug: parts[1] };
}
var EmbedApi = class {
  constructor({ apiBase = "https://proseid.com", apiKey, form, testMode = false, attribution = "full", fetchImpl = globalThis.fetch }) {
    if (typeof fetchImpl !== "function") throw new ProseIDError("fetch_unavailable", "This browser cannot load the form.");
    if (!/^proseid_pk_[a-f0-9]{32,64}$/.test(String(apiKey || ""))) {
      throw new ProseIDError("invalid_api_key", "A ProseID publishable key is required.");
    }
    this.fetch = fetchImpl.bind(globalThis);
    this.apiKey = apiKey;
    this.attribution = normalizeAttribution(attribution);
    if (testMode) {
      this.endpoint = `${String(apiBase).replace(/\/$/, "")}/api/embed/v1/test`;
    } else {
      const { publisher, slug } = parseFormCoordinate(form);
      this.endpoint = `${String(apiBase).replace(/\/$/, "")}/api/embed/v1/forms/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`;
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
  validate(formRef, responses, signal) {
    return this.request({ action: "validate", formRef, responses }, signal);
  }
  prepareSigning(formRef, sessionId, responses, signal) {
    return this.request({ action: "prepare_signing", formRef, sessionId, responses }, signal);
  }
  complete(formRef, sessionId, responses, signature = null, signal) {
    return this.request({ action: "complete", formRef, sessionId, responses, signature }, signal);
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
.label { color: var(--proseid-ink); font-size: 12px; font-weight: 650; }
.required { color: var(--proseid-accent-ink); }
.hint { color: var(--proseid-muted); font-size: 11px; line-height: 1.45; }
.control { width: 100%; min-height: 44px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); outline: none; background: var(--proseid-surface); padding: 10px 12px; color: var(--proseid-ink); font-size: 14px; transition: border-color .16s ease, box-shadow .16s ease; }
.control:focus { border-color: var(--proseid-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--proseid-accent) 13%, transparent); }
.control[aria-invalid="true"] { border-color: var(--proseid-accent); }
select.control { appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--proseid-muted) 50%), linear-gradient(135deg, var(--proseid-muted) 50%, transparent 50%); background-position: calc(100% - 16px) 18px, calc(100% - 11px) 18px; background-size: 5px 5px; background-repeat: no-repeat; padding-right: 32px; }
textarea.control { min-height: 96px; resize: vertical; }
.check { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border: 1px solid var(--proseid-rule); border-radius: var(--proseid-control-radius); background: var(--proseid-surface); cursor: pointer; }
.check input { width: 18px; height: 18px; margin: 1px 0 0; accent-color: var(--proseid-accent); }
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
.skeleton { padding: 28px; }
.skeleton-line { height: 12px; margin: 10px 0; border-radius: 8px; background: linear-gradient(90deg, var(--proseid-canvas), var(--proseid-skeleton-glow), var(--proseid-canvas)); background-size: 200% 100%; animation: shimmer 1.2s linear infinite; }
.skeleton-line:nth-child(2) { width: 62%; height: 30px; margin-top: 28px; }
.skeleton-line:nth-child(3) { width: 82%; }
.complete { padding: 42px 30px; text-align: center; }
.seal { display: grid; width: 54px; height: 54px; margin: 0 auto 20px; place-items: center; border: 1px solid color-mix(in srgb, var(--proseid-success) 25%, var(--proseid-rule)); border-radius: 50%; background: var(--proseid-success-tint); color: var(--proseid-success); font-size: 25px; }
.complete h2 { margin: 0; font: 500 30px/1.1 Georgia, serif; }
.complete p { max-width: 46ch; margin: 12px auto 0; color: var(--proseid-copy); font-size: 13px; line-height: 1.6; }
.receipt { width: fit-content; max-width: 100%; margin: 22px auto 0; border: 1px solid var(--proseid-rule); border-radius: 10px; background: var(--proseid-canvas); padding: 9px 12px; color: var(--proseid-muted); font: 10px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace; overflow-wrap: anywhere; }
:host([data-proseid-shell="flat"]) .shell { border-color: transparent; box-shadow: none; }
:host([data-proseid-shell="flat"]) .ledger { height: 2px; }
:host([data-proseid-fields="underline"]) .control { border-width: 0 0 1px; border-radius: 0; background: transparent; padding-right: 0; padding-left: 0; }
:host([data-proseid-fields="underline"]) .control:focus { border-color: var(--proseid-accent); box-shadow: 0 2px 0 -1px var(--proseid-accent); }
:host([data-proseid-fields="underline"]) .check { border-width: 0 0 1px; border-radius: 0; background: transparent; padding-right: 0; padding-left: 0; }
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
	.proseid-brand span { display: none; }
}
@media (prefers-reduced-motion: reduce) { .status-dot, .skeleton-line, .submit { animation: none; transition: none; } }
`;

// src/i18n.js
var dictionaries = {
  en: {
    verifiedPublisher: "\u2713 Verified publisher",
    verifiedBy: "Verified by",
    select: "Select\u2026",
    idle: "Enter your details to check this form",
    checking: "Checking your answers\u2026",
    ready: "Ready to submit",
    incomplete: "Complete the required fields",
    checkFailed: "Could not check this form. Try again.",
    creating: "Creating the verified record\u2026",
    submit: "Submit",
    submitting: "Submitting\u2026",
    privacy: "Checked by ProseID. Sent only when you submit.",
    privacyWhiteLabel: "Checked securely. Sent only when you submit.",
    completeTitle: "Submission complete.",
    delivered: (publisher) => `Your responses were verified and delivered to ${publisher}.`,
    auditRecord: (id) => `Audit record ${id}`,
    testCompleteTitle: "Test complete.",
    testDelivered: "The integration works. No session was saved or billed.",
    testRecord: (id) => `Test reference ${id}`,
    formUnavailable: "Form unavailable",
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
    idle: "Fyll i uppgifterna f\xF6r att kontrollera formul\xE4ret",
    checking: "Kontrollerar dina svar\u2026",
    ready: "Redo att skicka",
    incomplete: "Fyll i de obligatoriska f\xE4lten",
    checkFailed: "Formul\xE4ret kunde inte kontrolleras. F\xF6rs\xF6k igen.",
    creating: "Skapar den verifierade posten\u2026",
    submit: "Skicka",
    submitting: "Skickar\u2026",
    privacy: "Kontrolleras av ProseID. Skickas f\xF6rst n\xE4r du v\xE4ljer Skicka.",
    privacyWhiteLabel: "Kontrolleras s\xE4kert. Skickas f\xF6rst n\xE4r du v\xE4ljer Skicka.",
    completeTitle: "Inskickat.",
    delivered: (publisher) => `Dina svar verifierades och levererades till ${publisher}.`,
    auditRecord: (id) => `Revisionspost ${id}`,
    testCompleteTitle: "Testet \xE4r klart.",
    testDelivered: "Integrationen fungerar. Ingen session sparades eller debiterades.",
    testRecord: (id) => `Testreferens ${id}`,
    formUnavailable: "Formul\xE4ret \xE4r inte tillg\xE4ngligt",
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
    accent: "#ff6a3d",
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
    accent: "#ff6841",
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
    accent: "#ff6841",
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
var randomSessionId = () => `embed_${globalThis.crypto?.randomUUID?.().replaceAll("-", "") || Math.random().toString(36).slice(2).padEnd(16, "0")}`;
var ProseIDForm = class {
  constructor(target, options) {
    this.target = typeof target === "string" ? document.querySelector(target) : target;
    if (!(this.target instanceof Element)) throw new ProseIDError("invalid_target", "Choose an element to contain the ProseID form.");
    if (!options?.form && !options?.testMode) throw new ProseIDError("invalid_form", "The form coordinate is required.");
    if (!options?.apiKey) throw new ProseIDError("invalid_api_key", "A ProseID publishable key is required.");
    this.options = options;
    this.copy = messagesFor(options.locale, options.messages);
    this.attribution = normalizeAttribution(options.branding?.proseid);
    this.api = new EmbedApi({
      apiBase: options.apiBase,
      apiKey: options.apiKey,
      form: options.form,
      testMode: options.testMode === true,
      attribution: this.attribution,
      fetchImpl: options.fetch
    });
    this.signing = new SigningCoordinator(options.signingAdapter);
    this.shadow = this.target.shadowRoot || this.target.attachShadow({ mode: "open" });
    this.values = {};
    this.fields = /* @__PURE__ */ new Map();
    this.blurred = /* @__PURE__ */ new Set();
    this.submittedAttempted = false;
    this.valid = false;
    this.destroyed = false;
    this.validationTimer = null;
    this.validationAbort = null;
    this.sessionId = randomSessionId();
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
      this.attribution = normalizeAttribution(this.manifest.presentation?.attribution ?? this.attribution);
      this.api.setAttribution(this.attribution);
      if (this.manifest.capabilities?.signing?.requested && !this.manifest.capabilities.signing.available) {
        throw new ProseIDError("signing_not_available", "Signing is not available in embedded forms yet.");
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
  renderForm() {
    this.shadow.replaceChildren();
    this.installStyles();
    const shell = text("section", "shell");
    shell.setAttribute("aria-label", this.manifest.form.title);
    const head = text("header", "head");
    const brands = text("div", "brands");
    brands.append(this.brand(this.manifest.publisher));
    const proseidBrand = this.proseidBrand();
    if (proseidBrand) brands.append(proseidBrand);
    else brands.classList.add("publisher-only");
    head.append(brands, text("h1", "", this.manifest.form.title));
    if (this.manifest.form.description) head.append(text("p", "description", this.manifest.form.description));
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
    this.formNode.append(this.fieldList);
    const actions = text("div", "actions");
    const privacy = text("div", "privacy");
    privacy.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    privacy.append(text("span", "", this.attribution === "hidden" ? this.copy.privacyWhiteLabel : this.copy.privacy));
    this.submitButton = text("button", "submit", this.options.submitLabel || this.copy.submit);
    this.submitButton.type = "submit";
    this.submitButton.disabled = true;
    actions.append(privacy, this.submitButton);
    this.formNode.append(actions);
    body.append(this.formError, this.formNode);
    shell.append(text("div", "ledger"), head, body);
    this.shadow.append(shell);
  }
  renderField(name, definition) {
    const wrap = text("div", "field");
    wrap.hidden = definition.visible === false;
    const labelText = definition.label || name.replaceAll("_", " ");
    const id = `proseid-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
    let control;
    if (["boolean", "attestation"].includes(definition.type)) {
      const label = text("label", "check");
      control = document.createElement("input");
      control.type = "checkbox";
      control.checked = Boolean(this.values[name]);
      const copy = text("span", "check-copy", definition.statement || labelText);
      label.append(control, copy);
      wrap.append(label);
    } else {
      const label = text("label", "label", labelText);
      label.htmlFor = id;
      if (definition.required) label.append(text("span", "required", " *"));
      wrap.append(label);
      if (definition.type === "select") {
        control = document.createElement("select");
        const empty = text("option", "", this.copy.select);
        empty.value = "";
        control.append(empty);
        for (const option of definition.options || []) {
          const value = typeof option === "object" ? option.value : option;
          const item = text("option", "", typeof option === "object" ? option.label || value : value);
          item.value = value;
          control.append(item);
        }
      } else if (definition.multiline) {
        control = document.createElement("textarea");
      } else {
        control = document.createElement("input");
        control.type = ["number", "currency"].includes(definition.type) ? "number" : definition.type === "date" ? "date" : definition.format === "email" ? "email" : "text";
        if (definition.type === "currency") control.step = "0.01";
      }
      control.id = id;
      control.className = "control";
      control.value = this.values[name] ?? "";
      if (definition.placeholder) control.placeholder = definition.placeholder;
      if (definition.min != null) control.min = definition.min;
      if (definition.max != null) control.max = definition.max;
      wrap.append(control);
      if (definition.description || definition.help) wrap.append(text("span", "hint", definition.description || definition.help));
    }
    control.name = name;
    control.setAttribute("aria-describedby", `${id}-error`);
    control.addEventListener("input", () => this.change(name, definition, control));
    control.addEventListener("change", () => this.change(name, definition, control, true));
    control.addEventListener("blur", () => {
      this.blurred.add(name);
      this.renderIssues(this.lastValidation?.issues || []);
      this.scheduleValidation(0);
    });
    const error = text("span", "error");
    error.id = `${id}-error`;
    error.setAttribute("aria-live", "polite");
    wrap.append(error);
    this.fields.set(name, { wrap, control, error, definition, label: labelText });
    return wrap;
  }
  change(name, definition, control, immediate = false) {
    const value = ["boolean", "attestation"].includes(definition.type) ? control.checked : ["number", "currency"].includes(definition.type) && control.value !== "" ? Number(control.value) : control.value;
    if (Object.is(this.values[name], value)) return;
    this.values[name] = value;
    this.valid = false;
    this.submitButton.disabled = true;
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
      const result = await this.api.validate(this.manifest.form.ref, this.values, this.validationAbort.signal);
      this.lastValidation = result;
      this.valid = result.valid === true;
      this.applyDefinitions(result.definitions || {});
      this.renderIssues(result.issues || []);
      this.submitButton.disabled = !this.valid;
      this.setStatus(this.valid ? "ready" : "idle", this.valid ? this.copy.ready : this.copy.incomplete);
      this.emit("validation", { valid: this.valid, status: result.status, issues: result.issues || [] });
      return result;
    } catch (error) {
      if (error?.name === "AbortError") return null;
      this.valid = false;
      this.submitButton.disabled = true;
      this.setStatus("error", this.copy.checkFailed);
      this.emit("error", { error });
      return null;
    }
  }
  applyDefinitions(definitions) {
    for (const [name, resolved] of Object.entries(definitions)) {
      const field = this.fields.get(name);
      if (!field) continue;
      field.wrap.hidden = resolved?.visible === false;
    }
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
    this.formError.textContent = formIssues.join(" ");
    this.formError.hidden = formIssues.length === 0;
  }
  setStatus(state, copy) {
    if (!this.statusNode) return;
    this.statusNode.dataset.state = state;
    this.statusNode.querySelector(".status-copy").textContent = copy;
  }
  async submit(event) {
    event.preventDefault();
    if (this.destroyed) return;
    this.submittedAttempted = true;
    this.renderIssues(this.lastValidation?.issues || []);
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
        const nextAction = await this.api.prepareSigning(this.manifest.form.ref, this.sessionId, this.values);
        signature = await this.signing.handle(nextAction, { manifest: this.manifest, values: { ...this.values } });
        this.emit("signing", { nextAction, signature });
      }
      const result = await this.api.complete(this.manifest.form.ref, this.sessionId, this.values, signature);
      this.renderComplete(result);
      this.emit("complete", result);
    } catch (error) {
      this.submitButton.disabled = !this.valid;
      this.submitButton.textContent = this.options.submitLabel || this.copy.submit;
      this.formError.hidden = false;
      this.formError.textContent = errorMessage(error.code, error.message);
      this.setStatus("error", "Submission not saved");
      this.emit("error", { error });
    }
  }
  renderComplete(result) {
    const shell = this.shadow.querySelector(".shell");
    const complete = text("div", "complete");
    complete.append(text("div", "seal", "\u2713"), text("h2", "", result.test ? this.copy.testCompleteTitle : this.copy.completeTitle));
    complete.append(text("p", "", result.test ? this.copy.testDelivered : this.copy.delivered(this.manifest.publisher.name)));
    complete.append(text("div", "receipt", result.test ? this.copy.testRecord(result.sessionId) : this.copy.auditRecord(result.sessionId)));
    shell.replaceChildren(text("div", "ledger"), complete);
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
  return [...document.querySelectorAll("[data-proseid-form]")].map((element) => mount(element, {
    ...defaults,
    form: element.getAttribute("data-proseid-form"),
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
