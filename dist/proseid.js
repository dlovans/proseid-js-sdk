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
  flow_changed: "The applicable rules changed while this Flow was open. Reload the page before continuing.",
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
var VERSION = "0.12.0";

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
function parseFlowReference(value) {
  const reference = String(value ?? "").trim();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(reference)) {
    throw new ProseIDError("invalid_flow", "A valid Flow ID is required.");
  }
  return reference;
}
function normalizedApiBase(value) {
  try {
    const url = new URL(value || "https://proseid.com");
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(local && url.protocol === "http:") || url.username || url.password) {
      throw new Error("unsafe");
    }
    return url.origin;
  } catch {
    throw new ProseIDError("invalid_api_base", "Use a valid HTTPS ProseID address.");
  }
}
var EmbedApi = class {
  constructor({ apiBase = "https://proseid.com", apiKey, flow, testMode = false, attribution = "full", parentOrigin = "", fetchImpl = globalThis.fetch }) {
    if (typeof fetchImpl !== "function") throw new ProseIDError("fetch_unavailable", "This browser cannot load the Flow.");
    if (!/^proseid_pk_[a-f0-9]{32,64}$/.test(String(apiKey || ""))) {
      throw new ProseIDError("invalid_api_key", "A ProseID publishable key is required.");
    }
    this.fetch = fetchImpl.bind(globalThis);
    this.apiKey = apiKey;
    this.attribution = normalizeAttribution(attribution);
    this.parentOrigin = parentOrigin;
    const base = normalizedApiBase(apiBase);
    if (testMode) {
      this.endpoint = `${base}/api/embed/v1/test`;
    } else {
      const flowId = parseFlowReference(flow);
      this.endpoint = `${base}/api/embed/v1/flow-ids/${encodeURIComponent(flowId)}`;
    }
  }
  setAttribution(value) {
    this.attribution = normalizeAttribution(value);
  }
  async request(body, signal, extraHeaders = {}) {
    const response = await this.fetch(this.endpoint, {
      method: body ? "POST" : "GET",
      mode: "cors",
      credentials: "omit",
      headers: {
        accept: "application/json",
        "x-proseid-key": this.apiKey,
        "x-proseid-sdk-version": VERSION,
        "x-proseid-attribution": this.attribution,
        ...this.parentOrigin ? { "x-proseid-embed-origin": this.parentOrigin } : {},
        ...body ? { "content-type": "application/json" } : {},
        ...extraHeaders
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
  manifest(attemptId, signal) {
    return this.request(null, signal, {
      ...attemptId ? { "x-proseid-attempt-id": attemptId } : {}
    });
  }
  validate(flowRef, responses, effectiveAt, language, signal) {
    return this.request({ action: "validate", flowRef, responses, effectiveAt, language }, signal);
  }
  prepareSigning(flowRef, recordId, responses, effectiveAt, signal) {
    return this.request({ action: "prepare_signing", flowRef, recordId, responses, effectiveAt }, signal);
  }
  complete(flowRef, recordId, responses, effectiveAt, signature = null, language = "en", signal) {
    return this.request({ action: "complete", flowRef, recordId, responses, effectiveAt, signature, language }, signal);
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

// src/i18n/en.js
var en = {
  languageLabel: "Language",
  english: "English",
  swedish: "Swedish",
  verifiedBy: "Verified by",
  select: "Select\u2026",
  schemaDetails: "Schema details",
  jurisdictions: "Applies in",
  legalReferences: "Legal references",
  legalReference: "Legal reference",
  appliesOn: (date) => `Assessment date: ${date}`,
  interpretation: (version) => `Interpretation ${version}`,
  moreInformation: (label) => `More information about ${label}`,
  answerProgress: "Answer progress",
  answersNeeded: (count) => `${count} ${count === 1 ? "answer" : "answers"} needed`,
  answersNeedAttention: (count) => `${count} ${count === 1 ? "answer needs" : "answers need"} attention`,
  checkingAnswers: "Checking answers\u2026",
  checkingAnswersHelp: "The current answers are being verified",
  readyToComplete: "Ready to complete",
  goToFirstUnfinished: "Go to the first unfinished answer",
  goToFirstAttention: "Go to the first answer that needs attention",
  answersChecked: "All current answers passed validation",
  openAnswerNavigator: "Open answer status",
  closeAnswerNavigator: "Close answer status",
  requiredLabel: "Required",
  idle: "Enter your details to check this Flow",
  checking: "Checking your answers\u2026",
  ready: "Ready to complete",
  incomplete: "Complete the required fields",
  checkFailed: "Could not check this Flow. Try again.",
  creating: "Creating the verified record\u2026",
  submit: "Submit",
  submitting: "Submitting",
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
  receiptSending: "Sending",
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
  guidedContinueCue: "Continue when this answer looks right.",
  guidedReviewCue: "Review this final answer, then check the complete path before submitting.",
  back: "Back",
  continue: "Continue",
  reviewAnswers: "Review answers",
  finalCheck: "Final check",
  reviewTitle: "Review your answers",
  reviewHelp: "Nothing is sent until you confirm. The assessment appears after the record is created.",
  changeAnswer: "Change",
  notAnswered: "Not answered",
  calculatedOutcome: "Calculated outcome",
  completeAssessment: "Complete assessment",
  determinationFacts: "Facts",
  determinationTitle: "Enter what is known",
  determinationHelp: "Your answers are checked as you work. The calculated result appears after you submit.",
  calculate: "Calculate determination",
  calculating: "Calculating\u2026",
  calculateAgain: "Calculate again",
  determinationResult: "Determination",
  determinationWaiting: "The outcome updates automatically as you provide the facts.",
  determinationLive: "Your live determination",
  determinationPreparing: "Preparing the questions\u2026",
  determinationUpdating: "Checking your answers\u2026",
  determinationAuto: "Answers checked",
  resultEyebrow: "Recorded result",
  resultDetermination: "Determination",
  resultAssessment: "Assessment outcome",
  resultChecklist: "Checklist result",
  resultForm: "Submission result",
  resultHelp: "This is the authoritative result saved with the completed record.",
  resultNotes: "Important notes",
  determinationNotes: "Important notes",
  determinationCurrentIndication: "Current indication",
  determinationAuthority: "Legal basis",
  needsAttention: "Needs attention",
  reviewAnswersTitle: "Review these answers",
  noRecordCreated: "No record has been created. Correct the highlighted facts, then confirm again.",
  thisField: "This field",
  confirmDetermination: "Confirm determination",
  checklistTitle: "Review every control",
  checklistHelp: "Work through the checks below. Nothing is recorded until the whole checklist is complete.",
  checklistEyebrow: "Auditable compliance completion",
  checklistProgress: (reviewed, total) => `${reviewed} of ${total} controls reviewed`,
  checklistContext: "Context",
  checklistContextTitle: "Identify this review",
  checklistContextHelp: "These details travel with the completed record.",
  checklistControls: "Required review",
  checklistControlsLabel: "Controls",
  checklistControlsHelp: "Each item stays tied to this exact schema release.",
  checklistRecordedOutcome: "Recorded outcome",
  checklistConclusion: "What the schema concludes",
  checklistChoose: "Choose Yes or No before completing the checklist.",
  yes: "Yes",
  no: "No",
  completeChecklist: "Complete checklist",
  selectDate: "Select date",
  year: "Year",
  chooseDateFor: (label) => `Choose date for ${label}`,
  previousMonth: "Previous month",
  nextMonth: "Next month",
  clear: "Clear",
  today: "Today",
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  required: (label) => `${label} is required.`,
  confirm: "Please confirm to continue.",
  format: (label) => `${label} isn\u2019t in the expected format.`,
  validValue: "Please enter a valid value.",
  tooShort: "This is too short.",
  tooLong: "This is too long.",
  checkValue: "Please check this value."
};

// src/i18n/sv.js
var sv = {
  languageLabel: "Spr\xE5k",
  english: "Engelska",
  swedish: "Svenska",
  verifiedBy: "Verifierat av",
  select: "V\xE4lj\u2026",
  schemaDetails: "Schemadetaljer",
  jurisdictions: "G\xE4ller i",
  legalReferences: "R\xE4ttsliga h\xE4nvisningar",
  legalReference: "R\xE4ttslig h\xE4nvisning",
  appliesOn: (date) => `Bed\xF6mningsdatum: ${date}`,
  interpretation: (version) => `Tolkning ${version}`,
  moreInformation: (label) => `Mer information om ${label}`,
  answerProgress: "Svarsstatus",
  answersNeeded: (count) => `${count} svar beh\xF6vs`,
  answersNeedAttention: (count) => `${count} svar beh\xF6ver ses \xF6ver`,
  checkingAnswers: "Kontrollerar svaren\u2026",
  checkingAnswersHelp: "De aktuella svaren verifieras",
  readyToComplete: "Redo att slutf\xF6ra",
  goToFirstUnfinished: "G\xE5 till det f\xF6rsta obesvarade f\xE4ltet",
  goToFirstAttention: "G\xE5 till det f\xF6rsta svaret som beh\xF6ver ses \xF6ver",
  answersChecked: "Alla aktuella svar har godk\xE4nts",
  openAnswerNavigator: "\xD6ppna svarsstatus",
  closeAnswerNavigator: "St\xE4ng svarsstatus",
  requiredLabel: "Obligatoriskt",
  idle: "Fyll i uppgifterna f\xF6r att kontrollera fl\xF6det",
  checking: "Kontrollerar dina svar\u2026",
  ready: "Redo att skicka",
  incomplete: "Fyll i de obligatoriska f\xE4lten",
  checkFailed: "Fl\xF6det kunde inte kontrolleras. F\xF6rs\xF6k igen.",
  creating: "Skapar den verifierade posten\u2026",
  submit: "Skicka",
  submitting: "Skickar",
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
  receiptSending: "Skickar",
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
  guidedContinueCue: "Forts\xE4tt n\xE4r svaret ser r\xE4tt ut.",
  guidedReviewCue: "Granska det sista svaret och kontrollera sedan hela v\xE4gen innan du skickar.",
  back: "Tillbaka",
  continue: "Forts\xE4tt",
  reviewAnswers: "Granska svaren",
  finalCheck: "Slutlig kontroll",
  reviewTitle: "Granska dina svar",
  reviewHelp: "Inget skickas f\xF6rr\xE4n du bekr\xE4ftar. Bed\xF6mningen visas n\xE4r posten har skapats.",
  changeAnswer: "\xC4ndra",
  notAnswered: "Inte besvarat",
  calculatedOutcome: "Ber\xE4knat resultat",
  completeAssessment: "Slutf\xF6r bed\xF6mningen",
  determinationFacts: "Fakta",
  determinationTitle: "Ange det som \xE4r k\xE4nt",
  determinationHelp: "Dina svar kontrolleras medan du arbetar. Det ber\xE4knade resultatet visas n\xE4r du skickar in.",
  calculate: "Ber\xE4kna avg\xF6randet",
  calculating: "Ber\xE4knar\u2026",
  calculateAgain: "Ber\xE4kna igen",
  determinationResult: "Avg\xF6rande",
  determinationWaiting: "Resultatet uppdateras automatiskt n\xE4r du fyller i fakta.",
  determinationLive: "Ditt aktuella avg\xF6rande",
  determinationPreparing: "F\xF6rbereder fr\xE5gorna\u2026",
  determinationUpdating: "Kontrollerar dina svar\u2026",
  determinationAuto: "Svaren \xE4r kontrollerade",
  resultEyebrow: "Registrerat resultat",
  resultDetermination: "Avg\xF6rande",
  resultAssessment: "Bed\xF6mningsresultat",
  resultChecklist: "Checklistans resultat",
  resultForm: "Resultat",
  resultHelp: "Detta \xE4r det slutliga resultat som sparades med den slutf\xF6rda posten.",
  resultNotes: "Viktiga anm\xE4rkningar",
  determinationNotes: "Viktiga anm\xE4rkningar",
  determinationCurrentIndication: "Aktuell indikation",
  determinationAuthority: "R\xE4ttslig grund",
  needsAttention: "Beh\xF6ver \xE5tg\xE4rdas",
  reviewAnswersTitle: "Granska dessa svar",
  noRecordCreated: "Ingen post har skapats. R\xE4tta de markerade uppgifterna och bekr\xE4fta igen.",
  thisField: "Det h\xE4r f\xE4ltet",
  confirmDetermination: "Bekr\xE4fta avg\xF6randet",
  checklistTitle: "Granska varje kontroll",
  checklistHelp: "G\xE5 igenom kontrollerna nedan. Inget registreras f\xF6rr\xE4n hela checklistan \xE4r klar.",
  checklistEyebrow: "Sp\xE5rbart slutf\xF6rande av efterlevnad",
  checklistProgress: (reviewed, total) => `${reviewed} av ${total} kontroller granskade`,
  checklistContext: "Sammanhang",
  checklistContextTitle: "Identifiera granskningen",
  checklistContextHelp: "Uppgifterna f\xF6ljer med den slutf\xF6rda registreringen.",
  checklistControls: "Obligatorisk granskning",
  checklistControlsLabel: "Kontroller",
  checklistControlsHelp: "Varje punkt f\xF6rblir kopplad till exakt den h\xE4r schemaversionen.",
  checklistRecordedOutcome: "Registrerat resultat",
  checklistConclusion: "Schemats slutsats",
  checklistChoose: "V\xE4lj Ja eller Nej innan checklistan slutf\xF6rs.",
  yes: "Ja",
  no: "Nej",
  completeChecklist: "Slutf\xF6r checklistan",
  selectDate: "V\xE4lj datum",
  year: "\xC5r",
  chooseDateFor: (label) => `V\xE4lj datum f\xF6r ${label}`,
  previousMonth: "F\xF6reg\xE5ende m\xE5nad",
  nextMonth: "N\xE4sta m\xE5nad",
  clear: "Rensa",
  today: "I dag",
  weekdays: ["M\xE5n", "Tis", "Ons", "Tor", "Fre", "L\xF6r", "S\xF6n"],
  required: (label) => `${label} \xE4r obligatoriskt.`,
  confirm: "Bekr\xE4fta f\xF6r att forts\xE4tta.",
  format: (label) => `${label} har inte r\xE4tt format.`,
  validValue: "Ange ett giltigt v\xE4rde.",
  tooShort: "V\xE4rdet \xE4r f\xF6r kort.",
  tooLong: "V\xE4rdet \xE4r f\xF6r l\xE5ngt.",
  checkValue: "Kontrollera v\xE4rdet."
};

// src/i18n.js
var dictionaries = { en, sv };
function messagesFor(locale = "en", overrides = {}) {
  const language = String(locale).toLowerCase().split("-")[0];
  return { ...dictionaries[language] ?? dictionaries.en, ...overrides };
}

// src/form/lifecycle/preferences.js
var LANGUAGES = /* @__PURE__ */ new Set(["en", "sv"]);
var LANGUAGE_STORAGE_KEY = "proseid_flow_language";
var normalizeLocale = (value) => {
  const language = String(value || "").trim().toLowerCase().split("-")[0];
  return LANGUAGES.has(language) ? language : "en";
};
var readLocalePreference = () => {
  try {
    const value = globalThis.localStorage?.getItem?.(LANGUAGE_STORAGE_KEY);
    return LANGUAGES.has(value) ? value : "";
  } catch {
    return "";
  }
};
var saveLocalePreference = (value) => {
  try {
    globalThis.localStorage?.setItem?.(LANGUAGE_STORAGE_KEY, value);
  } catch {
  }
};

// src/form/lifecycle/load.js
async function load() {
  try {
    this.manifest = await this.api.manifest(this.recordId);
    if (this.destroyed) return this;
    this.flowType = this.manifest.flow?.flowType || "form";
    if (!FLOW_TYPES.has(this.flowType)) {
      throw new ProseIDError(
        "flow_type_not_supported",
        `This version of the JavaScript SDK cannot render the \u201C${this.flowType}\u201D Flow experience.`
      );
    }
    this.attribution = normalizeAttribution(this.manifest.presentation?.attribution ?? this.attribution);
    this.locale = this.explicitLocale || readLocalePreference() || normalizeLocale(this.manifest.flow?.language);
    this.copy = messagesFor(this.locale, this.options.messages);
    this.api.setAttribution?.(this.attribution);
    this.applyTheme(
      this.manifest.presentation?.theme ?? this.options.theme,
      this.manifest.presentation?.colors
    );
    this.applyAppearance(this.options.appearance ?? this.manifest.presentation?.appearance);
    if (this.manifest.capabilities?.signing?.requested && !this.manifest.capabilities.signing.available) {
      throw new ProseIDError("signing_not_available", "Signing is not available in this embedded Flow yet.");
    }
    this.seedValues();
    this.renderForm();
    this.emit("ready", { manifest: this.manifest });
    if (this.options.initialCompletion) {
      this.renderComplete(this.options.initialCompletion);
      return this;
    }
    await this.validate();
    return this;
  } catch (error) {
    this.renderFatal(error);
    this.emit("error", { error });
    throw error;
  }
}
function seedValues() {
  for (const [name, definition] of Object.entries(this.manifest.schema?.definitions || {})) {
    let value = definition?.value;
    if (definition?.readonly !== true && this.options.initialValues && Object.prototype.hasOwnProperty.call(this.options.initialValues, name)) value = this.options.initialValues[name];
    if (definition?.type === "select" && (value === void 0 || value === null)) value = "";
    if (definition?.type === "attestation" && value !== true) value = false;
    this.values[name] = value;
  }
}
var FLOW_TYPES = /* @__PURE__ */ new Set(["form", "guided_assessment", "determination", "checklist"]);

// src/form/dom.js
var text = (tag, className, value = "") => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = value;
  return node;
};

// src/form/lifecycle/language.js
function setLocale(locale) {
  const next = normalizeLocale(locale);
  if (next === this.locale) return;
  const restoreGuidedReview = this.flowType === "guided_assessment" && this.guidedPhase === "review";
  this.locale = next;
  this.copy = messagesFor(next, this.options.messages);
  saveLocalePreference(next);
  for (const cleanup of this.cleanupFns.splice(0)) cleanup();
  this.fields.clear();
  this.renderForm();
  if (this.lastValidation) {
    this.applyDefinitions(this.lastValidation.definitions || {});
    this.renderIssues(this.lastValidation.issues || []);
  }
  if (restoreGuidedReview) this.showGuidedReview();
  this.updateSubmitState();
  this.setStatus(
    this.validationInFlight || this.validationScheduled ? "checking" : this.valid ? "ready" : "idle",
    this.validationInFlight || this.validationScheduled ? this.copy.checking : this.valid ? this.copy.ready : this.copy.incomplete
  );
  this.emit("language", { language: next });
}
function renderLanguageSelector() {
  const wrap = text("div", "language-controls");
  const selector = text("label", "language-selector");
  const control = document.createElement("select");
  control.setAttribute("aria-label", this.copy.languageLabel);
  for (const language of ["en", "sv"]) {
    const option = text("option", "", language === "sv" ? this.copy.swedish : this.copy.english);
    option.value = language;
    control.append(option);
  }
  control.value = this.locale;
  control.addEventListener("change", () => this.setLocale(control.value));
  const chevron = text("span", "language-chevron");
  chevron.setAttribute("aria-hidden", "true");
  selector.append(control, chevron);
  const mobile = document.createElement("details");
  mobile.className = "language-selector-mobile";
  const summary = text("summary", "language-summary");
  summary.setAttribute("aria-label", this.copy.languageLabel);
  summary.append(
    text("span", "language-abbreviation", this.locale.toUpperCase()),
    text("span", "language-summary-chevron")
  );
  const menu = text("div", "language-menu");
  for (const language of ["en", "sv"]) {
    const option = text("button", "language-option", language === "sv" ? this.copy.swedish : this.copy.english);
    option.type = "button";
    option.dataset.language = language;
    option.setAttribute("aria-current", language === this.locale ? "true" : "false");
    option.addEventListener("click", () => {
      mobile.open = false;
      this.setLocale(language);
    });
    menu.append(option);
  }
  mobile.append(summary, menu);
  mobile.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    mobile.open = false;
    summary.focus();
  });
  mobile.addEventListener("focusout", (event) => {
    if (!mobile.contains(event.relatedTarget)) mobile.open = false;
  });
  wrap.append(selector, mobile);
  return wrap;
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
var COLOR_TOKEN_NAMES = Object.freeze([
  "accent",
  "accentInk",
  "canvas",
  "surface",
  "ink",
  "copy",
  "muted",
  "rule",
  "success",
  "successTint",
  "submitInk",
  "skeletonGlow"
]);
var COLOR_TOKEN_SET = new Set(COLOR_TOKEN_NAMES);
var HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
function normalizeTheme(value) {
  return typeof value === "string" && Object.hasOwn(THEMES, value) ? value : "light";
}
function normalizeColors(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const normalized = {};
  for (const [name, color] of Object.entries(value)) {
    if (COLOR_TOKEN_SET.has(name) && typeof color === "string" && HEX_COLOR.test(color)) {
      normalized[name] = color.toLowerCase();
    }
  }
  return normalized;
}

// src/form/rendering/appearance.js
function applyTheme(theme = {}, manifestColors = {}) {
  const name = normalizeTheme(theme);
  this.target.dataset.proseidTheme = name;
  const colors = {
    ...THEMES[name],
    ...normalizeColors(manifestColors),
    ...normalizeColors(this.options.colors)
  };
  for (const [key, value] of Object.entries(colors)) {
    const token = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    this.target.style.setProperty(`--proseid-${token}`, value);
  }
}
function applyAppearance(appearance) {
  const value = normalizeAppearance(appearance);
  this.target.dataset.proseidShape = value.shape;
  this.target.dataset.proseidFields = value.fields;
  this.target.dataset.proseidShell = value.shell;
  this.target.dataset.proseidDensity = value.density;
}

// src/styles/shell.js
var shellStyles = `
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

// src/styles/fields.js
var fieldsStyles = `.fields { display: grid; gap: var(--proseid-field-gap); }
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
`;

// src/styles/actions.js
var actionsStyles = `.actions { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 18px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--proseid-rule); }
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

// src/styles/experiences.js
var experiencesStyles = `.guided-layout { display: grid; grid-template-columns: minmax(150px, .62fr) minmax(0, 1.55fr); gap: clamp(24px, 5vw, 54px); align-items: start; min-height: 390px; }
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

// src/styles/completion.js
var completionStyles = `.signature-overlay { position: fixed; z-index: 2147483647; inset: 0; display: grid; place-items: center; background: rgba(18, 20, 19, .62); padding: 20px; }
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

// src/styles/appearance.js
var appearanceStyles = `:host([data-proseid-shell="flat"]) .shell { border-color: transparent; box-shadow: none; }
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

// src/styles/responsive.js
var responsiveStyles = `@keyframes shimmer { to { background-position: -200% 0; } }
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

// src/styles.js
var styles = shellStyles + fieldsStyles + actionsStyles + experiencesStyles + completionStyles + appearanceStyles + responsiveStyles;

// src/form/rendering/shell.js
function installStyles() {
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
function renderLoading() {
  this.shadow.replaceChildren();
  this.installStyles();
  const shell = text("div", "shell");
  const skeleton = text("div", "skeleton");
  for (let i = 0; i < 6; i++) skeleton.append(text("div", "skeleton-line"));
  const ledger = this.renderLedger("loading");
  if (ledger) shell.append(ledger);
  shell.append(skeleton);
  this.shadow.append(shell);
}
function renderForm() {
  this.shadow.replaceChildren();
  this.installStyles();
  const shell = text("section", "shell");
  shell.setAttribute("aria-label", this.manifest.flow.title);
  const head = text("header", "head");
  const brands = text("div", "brands");
  brands.append(this.brand(this.manifest.publisher));
  const respondentTools = text("div", "respondent-tools");
  respondentTools.append(this.renderLanguageSelector());
  const proseidBrand2 = this.proseidBrand();
  if (proseidBrand2) respondentTools.append(proseidBrand2);
  brands.append(respondentTools);
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
  this.validationNavigator = this.renderValidationNavigator();
  if (this.flowType === "guided_assessment") this.formNode.append(this.renderGuided());
  else if (this.flowType === "determination") this.formNode.append(this.renderDetermination());
  else if (this.flowType === "checklist") this.formNode.append(this.renderChecklist());
  else this.formNode.append(this.fieldList, this.renderActions({ standardForm: true }));
  body.append(this.formError, this.formNode);
  this.progressNode = this.renderLedger();
  this.progressFill = this.progressNode?.querySelector(".ledger-fill") || null;
  if (this.progressNode) {
    this.progressNode.setAttribute("role", "progressbar");
    this.progressNode.setAttribute("aria-label", this.copy.answerProgress);
    this.progressNode.setAttribute("aria-valuemin", "0");
    this.progressNode.setAttribute("aria-valuemax", "100");
    shell.append(this.progressNode);
  }
  shell.append(head, body);
  this.shadow.append(shell);
  this.updateAnswerProgress();
  this.updateValidationNavigator();
}

// src/form/rendering/branding.js
function brand(publisher) {
  const wrap = text("div", "brand");
  const organization = text("a", "brand-organization");
  organization.href = this.registryUrl(`/registry/${encodeURIComponent(publisher.slug)}`);
  organization.target = "_blank";
  organization.rel = "noopener noreferrer";
  organization.setAttribute("aria-label", `Open ${publisher.name} in the ProseID Registry`);
  const customLogo = safeLogoUrl(this.options.branding?.logoUrl);
  const logo = customLogo || safeLogoUrl(publisher.logo);
  if (logo) {
    const img = document.createElement("img");
    img.src = logo;
    img.alt = this.options.branding?.logoAlt || `${publisher.name} logo`;
    organization.append(img);
  } else {
    organization.append(text("span", "brand-fallback", publisher.name.slice(0, 2).toUpperCase()));
  }
  const copy = text("div", "brand-copy");
  copy.append(text("div", "brand-name", publisher.name));
  copy.append(text("div", "brand-note", `@${publisher.slug}`));
  organization.append(copy);
  wrap.append(organization);
  const author = this.manifest.author;
  if (author?.username) {
    const authorLink = text("a", "brand-author", `@${author.username}`);
    authorLink.href = this.registryUrl(`/registry/publishers/${encodeURIComponent(author.username)}`);
    authorLink.target = "_blank";
    authorLink.rel = "noopener noreferrer";
    if (author.verified) {
      const verified = text("span", "author-verified", "\u2713");
      verified.setAttribute("aria-label", "Verified professional");
      verified.title = "Verified professional";
      authorLink.append(verified);
    }
    wrap.append(authorLink);
  }
  return wrap;
}
function registryUrl(path) {
  const base = safeLogoUrl(this.manifest?.branding?.proseid?.url) || "https://proseid.com/";
  return new URL(path, base).href;
}
function proseidBrand() {
  if (this.attribution === "hidden") return null;
  const brand2 = this.manifest.branding.proseid;
  const link = text("a", `proseid-brand${this.attribution === "compact" ? " compact" : ""}`);
  link.href = brand2.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `${this.copy.verifiedBy} ProseID`);
  const img = document.createElement("img");
  img.src = brand2.logo;
  img.alt = "ProseID";
  if (this.attribution === "full") link.append(text("span", "", this.copy.verifiedBy));
  link.append(img);
  return link;
}

// src/form/rendering/metadata.js
function renderSchemaDetails() {
  const metadata = this.manifest.schema?.metadata || {};
  const title = String(metadata.title || this.manifest.schema?.title || "").trim();
  const description = String(metadata.description || "").trim();
  const jurisdictions = Array.isArray(metadata.jurisdictions) ? metadata.jurisdictions.filter(Boolean) : [];
  const references = Array.isArray(metadata.legal_references) ? metadata.legal_references.filter(Boolean) : [];
  const temporal = this.manifest.flow?.temporalContext;
  if (!title && !description && jurisdictions.length === 0 && references.length === 0 && !temporal?.logic_version) return null;
  const details = text("details", "schema-details");
  details.append(text("summary", "", this.copy.schemaDetails));
  const content = text("div", "schema-details-content");
  if (title && title !== this.manifest.flow.title) content.append(text("strong", "schema-title", title));
  if (description && description !== this.manifest.flow.description) {
    content.append(text("p", "schema-summary", description));
  }
  if (temporal?.logic_version) {
    const period = text("div", "temporal-context");
    period.append(
      text("span", "", this.copy.appliesOn(this.manifest.flow.effectiveAt)),
      text("span", "", this.copy.interpretation(temporal.logic_version))
    );
    content.append(period);
  }
  if (jurisdictions.length) {
    const group = text("div", "metadata-group");
    group.append(text("div", "metadata-label", this.copy.jurisdictions));
    const values = text("div", "jurisdiction-list");
    for (const jurisdiction of jurisdictions) {
      const code = String(jurisdiction).toUpperCase();
      const chip = text("span", "jurisdiction", jurisdictionName(code, this.locale));
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

// src/form/rendering/actions.js
function defaultSubmitLabel() {
  if (this.flowType === "guided_assessment") return this.copy.completeAssessment;
  if (this.flowType === "determination") return this.copy.confirmDetermination;
  if (this.flowType === "checklist") return this.copy.completeChecklist;
  return this.copy.submit;
}
function setButtonBusy(button, busy, label) {
  if (!button) return;
  button.classList.toggle("is-loading", busy);
  button.setAttribute("aria-busy", String(busy));
  button.replaceChildren();
  if (busy) {
    const spinner = text("span", "button-spinner");
    spinner.setAttribute("aria-hidden", "true");
    button.append(spinner);
  }
  button.append(text("span", "button-label", label));
}
function renderPrivacy() {
  const privacy = text("div", "privacy");
  privacy.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
  privacy.append(text("span", "", this.attribution === "hidden" ? this.copy.privacyWhiteLabel : this.copy.privacy));
  return privacy;
}
function renderActions({ standardForm = false } = {}) {
  const actions = text("div", standardForm ? "actions standard-form-actions" : "actions");
  const meta = text("div", "action-meta");
  meta.append(this.validationNavigator);
  actions.append(meta, this.submitButton);
  return actions;
}
function updateSubmitState() {
  if (!this.submitButton) return;
  this.submitButton.disabled = this.submitting || this.guidedChecking || this.validationLocked;
  this.updateValidationNavigator();
}
function setStatus(state, copy) {
  if (!this.statusNode) return;
  this.statusNode.dataset.state = state;
  this.statusNode.querySelector(".status-copy").textContent = copy;
}

// src/form/input-patterns.js
var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// src/form/validation/local-constraints.js
var isEmptyValue = (_definition, value) => value === void 0 || value === null || value === "";
var answerProvided = (definition, value) => {
  if (definition?.type === "attestation" && definition?.required === true) return value === true;
  return !isEmptyValue(definition, value);
};
var validIsoDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
var optionValues = (definition) => new Set((definition?.options || []).map(
  (option) => typeof option === "object" ? option.value : option
));
var localConstraintIssue = (name, definition, value, { includeRequired = false } = {}) => {
  const empty = isEmptyValue(definition, value);
  if (empty) {
    if (includeRequired && definition?.required === true) {
      return {
        field_id: name,
        severity: "error",
        kind: definition.type === "attestation" ? "attestation_incomplete" : "missing_required",
        trigger: "correction",
        local: true
      };
    }
    return null;
  }
  if (definition?.type === "attestation" && definition.required === true && value !== true) {
    return { field_id: name, severity: "error", kind: "attestation_incomplete", trigger: "correction", local: true };
  }
  if (definition?.type === "boolean" && typeof value !== "boolean") {
    return { field_id: name, severity: "error", kind: "type_mismatch", trigger: "correction", local: true };
  }
  if (definition?.type === "select" && !optionValues(definition).has(value)) {
    return { field_id: name, severity: "error", kind: "constraint_violation", trigger: "correction", local: true };
  }
  if (["number", "currency"].includes(definition?.type)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { field_id: name, severity: "error", kind: "type_mismatch", trigger: "correction", local: true };
    }
    if (definition.min != null && value < Number(definition.min)) {
      return { field_id: name, severity: "error", kind: "constraint_violation", trigger: "correction", local: true };
    }
    if (definition.max != null && value > Number(definition.max)) {
      return { field_id: name, severity: "error", kind: "constraint_violation", trigger: "correction", local: true };
    }
  }
  if (definition?.type === "date") {
    if (!validIsoDate(value)) {
      return { field_id: name, severity: "error", kind: "type_mismatch", trigger: "correction", local: true };
    }
    if (definition.min && String(value) < String(definition.min)) {
      return { field_id: name, severity: "error", kind: "constraint_violation", trigger: "correction", local: true };
    }
    if (definition.max && String(value) > String(definition.max)) {
      return { field_id: name, severity: "error", kind: "constraint_violation", trigger: "correction", local: true };
    }
  }
  if (definition?.type === "string") {
    if (typeof value !== "string") {
      return { field_id: name, severity: "error", kind: "type_mismatch", trigger: "correction", local: true };
    }
    if (definition.min_length != null && value.length < Number(definition.min_length)) {
      return { field_id: name, severity: "error", kind: "constraint_violation", trigger: "correction", message: "Too short.", local: true };
    }
    if (definition.max_length != null && value.length > Number(definition.max_length)) {
      return { field_id: name, severity: "error", kind: "constraint_violation", trigger: "correction", message: "Too long.", local: true };
    }
    if (definition.format === "email" && !EMAIL_RE.test(value)) {
      return { field_id: name, severity: "error", kind: "type_mismatch", trigger: "correction", local: true };
    }
    if (definition.pattern) {
      try {
        if (!new RegExp(definition.pattern).test(value)) {
          return { field_id: name, severity: "error", kind: "constraint_violation", trigger: "correction", message: "Pattern mismatch.", local: true };
        }
      } catch {
      }
    }
  }
  return null;
};

// src/form/labels.js
var CHOICE_ACRONYMS = /* @__PURE__ */ new Map([
  ["ai", "AI"],
  ["api", "API"],
  ["ccpa", "CCPA"],
  ["dns", "DNS"],
  ["dora", "DORA"],
  ["eea", "EEA"],
  ["eu", "EU"],
  ["ftc", "FTC"],
  ["gdpr", "GDPR"],
  ["gpai", "GPAI"],
  ["hipaa", "HIPAA"],
  ["ict", "ICT"],
  ["it", "IT"],
  ["i", "I"],
  ["ii", "II"],
  ["iii", "III"],
  ["iv", "IV"],
  ["v", "V"],
  ["vi", "VI"],
  ["vii", "VII"],
  ["viii", "VIII"],
  ["ix", "IX"],
  ["x", "X"],
  ["xi", "XI"],
  ["xii", "XII"],
  ["xiii", "XIII"],
  ["nis2", "NIS2"],
  ["osha", "OSHA"],
  ["pdf", "PDF"],
  ["sec", "SEC"],
  ["tld", "TLD"],
  ["uk", "UK"],
  ["us", "US"]
]);
var humanizeText = (value) => {
  const source = String(value ?? "").trim();
  if (!source || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(source) || /^[a-z][a-z0-9+.-]*:\/\//i.test(source)) return source;
  const spaced = source.replace(/_+/g, " ").replace(/\s+/g, " ");
  return spaced.charAt(0).toLocaleUpperCase() + spaced.slice(1);
};
var humanizeChoice = (value) => humanizeText(value).split(" ").map((word) => CHOICE_ACRONYMS.get(word.toLocaleLowerCase()) ?? word).join(" ");

// src/form/rendering/progress.js
function progressEnabled() {
  return this.options.showProgress !== false;
}
function renderLedger(className = "") {
  if (!this.progressEnabled()) return null;
  const ledger = text("div", `ledger${className ? ` ${className}` : ""}`);
  ledger.append(text("span", "ledger-fill"));
  return ledger;
}
function visibleFields() {
  return [...this.fields.entries()].filter(([, field]) => field.engineVisible !== false);
}
function updateAnswerProgress() {
  if (!this.progressNode || !this.progressFill) return;
  const fields = this.visibleFields();
  const answered = fields.filter(([name, field]) => answerProvided(field.definition, this.values[name])).length;
  const percent = fields.length ? Math.round(answered / fields.length * 100) : 100;
  this.progressFill.style.width = `${percent}%`;
  this.progressNode.setAttribute("aria-valuenow", String(percent));
  this.progressNode.setAttribute("aria-valuetext", `${answered} of ${fields.length}`);
}
function displayValue(value, definition) {
  if (isEmptyValue(definition, value)) return this.copy.notAnswered;
  if (["boolean", "attestation"].includes(definition?.type)) return value === true ? this.copy.yes : this.copy.no;
  if (typeof value === "object") return JSON.stringify(value);
  return humanizeChoice(value);
}

// src/form/rendering/fatal.js
function renderFatal(error) {
  this.shadow.replaceChildren();
  this.installStyles();
  const shell = text("section", "shell");
  const complete = text("div", "completion-view");
  complete.append(text("div", "seal", "!"), text("h2", "", this.copy.formUnavailable));
  complete.append(text("p", "", errorMessage(error?.code, error?.message)));
  const ledger = this.renderLedger();
  if (ledger) shell.append(ledger);
  shell.append(complete);
  this.shadow.append(shell);
}

// src/form/experiences/guided-layout.js
function renderGuided() {
  const guided = text("div", "guided");
  this.guidedQuestion = text("section", "guided-question");
  this.guidedIndexNode = text("div", "guided-index");
  this.guidedFieldSlot = text("div", "guided-field-slot");
  const navigation = text("div", "guided-navigation");
  this.guidedNavigation = navigation;
  this.guidedBack = text("button", "secondary-action", this.copy.back);
  this.guidedBack.type = "button";
  this.guidedBack.addEventListener("click", () => this.guidedPrevious());
  this.guidedNext = text("button", "primary-action", this.copy.continue);
  this.guidedNext.type = "button";
  this.guidedNext.addEventListener("click", () => this.guidedContinue());
  navigation.append(this.guidedBack, this.validationNavigator, this.guidedNext);
  this.guidedQuestion.append(this.guidedIndexNode, this.guidedFieldSlot, navigation);
  this.guidedPath = text("aside", "guided-path");
  this.guidedPathHeading = text("div", "guided-path-heading");
  this.guidedPathHeadingLabel = text("span", "", this.copy.guidedPath);
  this.guidedPathHeadingCount = text("strong");
  this.guidedPathHeading.append(this.guidedPathHeadingLabel, this.guidedPathHeadingCount);
  this.guidedPathList = document.createElement("ol");
  this.guidedPathList.tabIndex = 0;
  this.guidedPathList.setAttribute("aria-label", this.copy.guidedPath);
  this.guidedPath.append(this.guidedPathHeading);
  if (this.progressEnabled()) {
    this.guidedPathProgress = text("div", "guided-progress");
    this.guidedPathProgressFill = text("span");
    this.guidedPathProgress.append(this.guidedPathProgressFill);
    this.guidedPath.append(this.guidedPathProgress);
  }
  this.guidedPath.append(this.guidedPathList);
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
function refreshGuided() {
  if (!this.guidedQuestion) return;
  const list = this.guidedPathList;
  const previousPathScrollTop = list?.scrollTop || 0;
  if (this.validationNavigator?.parentNode !== this.guidedNavigation) {
    this.guidedNavigation.insertBefore(this.validationNavigator, this.guidedNext);
  }
  const entries = this.visibleFields();
  if (!entries.length) {
    this.guidedQuestion.replaceChildren(text("p", "empty-state", "This Flow has no visible questions."));
    this.guidedPath.hidden = true;
    return;
  }
  this.guidedPath.hidden = false;
  this.guidedIndex = Math.min(this.guidedIndex, entries.length - 1);
  const [currentName, field] = entries[this.guidedIndex];
  for (const [, candidate] of entries) {
    candidate.wrap.hidden = candidate !== field;
    if (candidate !== field && candidate.wrap.parentNode !== this.guidedParking) this.guidedParking.append(candidate.wrap);
  }
  field.wrap.hidden = false;
  if (this.guidedFieldSlot.childElementCount !== 1 || this.guidedFieldSlot.firstElementChild !== field.wrap) {
    this.guidedFieldSlot.replaceChildren(field.wrap);
  }
  this.guidedIndexNode.replaceChildren(
    text("span", "", this.copy.guidedProgress(this.guidedIndex + 1, entries.length)),
    text("small", "", this.guidedIndex === entries.length - 1 ? this.copy.guidedReviewCue : this.copy.guidedContinueCue)
  );
  this.guidedBack.disabled = this.guidedIndex === 0;
  this.guidedNext.disabled = this.guidedChecking;
  this.guidedNext.textContent = this.guidedIndex === entries.length - 1 ? this.copy.reviewAnswers : this.copy.continue;
  this.guidedPathHeadingLabel.textContent = this.copy.guidedPath;
  this.guidedPathHeadingCount.textContent = `${this.guidedIndex + 1}/${entries.length}`;
  list.setAttribute("aria-label", this.copy.guidedPath);
  if (this.guidedPathProgressFill) {
    const answered = entries.filter(([name, candidate]) => answerProvided(candidate.definition, this.values[name])).length;
    this.guidedPathProgressFill.style.width = `${Math.round(answered / entries.length * 100)}%`;
  }
  const existingItems = new Map([...list.children].map((item) => [item.dataset.field, item]));
  const nextItems = entries.map(([entryName, entryField], index) => {
    let item = existingItems.get(entryName);
    if (!item) {
      item = text("li");
      item.dataset.field = entryName;
      const button2 = text("button", "guided-path-button");
      button2.type = "button";
      const marker2 = text("span", "guided-marker");
      const pathCopy = text("span", "guided-path-copy");
      pathCopy.append(text("strong"), text("small"));
      button2.append(marker2, pathCopy);
      let navigatedOnPointerDown = false;
      button2.addEventListener("pointerdown", (event) => {
        if (button2.disabled || event.button !== 0) return;
        navigatedOnPointerDown = true;
        event.preventDefault();
        this.goToGuidedQuestion(entryName);
      });
      button2.addEventListener("click", (event) => {
        event.preventDefault();
        if (button2.disabled) return;
        if (navigatedOnPointerDown) {
          navigatedOnPointerDown = false;
          return;
        }
        this.goToGuidedQuestion(entryName);
      });
      item.append(button2);
    }
    const button = item.querySelector(".guided-path-button");
    const marker = item.querySelector(".guided-marker");
    const label = item.querySelector(".guided-path-copy strong");
    const detail = item.querySelector(".guided-path-copy small");
    const hasAnswer = answerProvided(entryField.definition, this.values[entryName]);
    const isActive = index === this.guidedIndex;
    item.className = isActive ? hasAnswer ? "active answered" : "active" : hasAnswer ? "answered" : "remaining";
    if (isActive) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
    button.disabled = isActive || !hasAnswer;
    marker.textContent = hasAnswer ? "\u2713" : "";
    label.textContent = entryField.label;
    detail.textContent = isActive ? this.copy.guidedCurrent : hasAnswer ? this.displayValue(this.values[entryName], entryField.definition) : this.copy.notAnswered;
    return item;
  });
  const currentItems = [...list.children];
  const structureChanged = currentItems.length !== nextItems.length || currentItems.some((item, index) => item !== nextItems[index]);
  if (structureChanged) list.replaceChildren(...nextItems);
  list.scrollTop = previousPathScrollTop;
  requestAnimationFrame(() => {
    const active = list.querySelector(".active");
    if (!active || list.scrollHeight <= list.clientHeight) return;
    const listBounds = list.getBoundingClientRect();
    const activeBounds = active.getBoundingClientRect();
    let nextTop = list.scrollTop;
    if (activeBounds.top < listBounds.top) nextTop -= listBounds.top - activeBounds.top;
    else if (activeBounds.bottom > listBounds.bottom) nextTop += activeBounds.bottom - listBounds.bottom;
    if (Math.abs(nextTop - list.scrollTop) < 1) return;
    const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ top: Math.max(0, nextTop), behavior: reducedMotion ? "auto" : "smooth" });
  });
}

// src/form/experiences/guided-navigation.js
function goToGuidedQuestion(name) {
  clearTimeout(this.validationTimer);
  const entries = this.visibleFields();
  const index = entries.findIndex(([entryName]) => entryName === name);
  if (index < 0) return;
  this.guidedChecking = false;
  this.guidedPhase = "questions";
  this.guidedIndex = index;
  this.guidedReview.hidden = true;
  this.guidedQuestion.hidden = false;
  this.guidedPath.hidden = false;
  this.refreshGuided();
  requestAnimationFrame(() => {
    const field = this.fields.get(name);
    const controls = field?.controls || [field?.control];
    (controls.find((control) => control?.checked) || controls.find((control) => control && control.type !== "hidden"))?.focus?.({ preventScroll: true });
  });
}
async function guidedContinue() {
  if (this.guidedNext.disabled) return;
  clearTimeout(this.validationTimer);
  const entries = this.visibleFields();
  const current = entries[this.guidedIndex];
  if (!current) return;
  const [currentName, currentField] = current;
  this.blurred.add(currentName);
  const localIssues = this.localValidationIssues([currentName], { includeRequired: true });
  this.renderLocalIssues([currentName], localIssues);
  if (localIssues.some((issue) => issue.severity === "error")) {
    this.refreshGuided();
    currentField.control?.focus?.();
    return;
  }
  this.guidedChecking = true;
  this.guidedNext.disabled = true;
  this.guidedNext.textContent = this.copy.checking;
  const result = await this.validate();
  if (!result) {
    this.guidedChecking = false;
    this.refreshGuided();
    return;
  }
  const blocking = (result?.issues || []).some((issue) => issue.field_id === currentName && issue.severity === "error");
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
    this.guidedFieldSlot.querySelector('input:not([type="hidden"]), select, textarea, button')?.focus?.({ preventScroll: true });
  } else this.showGuidedReview();
}
function guidedPrevious() {
  if (this.guidedPhase === "review") {
    this.guidedPhase = "questions";
    this.guidedIndex = Math.max(0, this.visibleFields().length - 1);
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
function showGuidedReview() {
  this.guidedPhase = "review";
  for (const field of this.fields.values()) this.guidedParking.append(field.wrap);
  this.guidedQuestion.hidden = true;
  this.guidedPath.hidden = true;
  this.guidedReview.hidden = false;
  this.guidedReview.replaceChildren();
  const head = text("header", "review-head");
  head.append(text("span", "eyebrow", this.copy.finalCheck), text("h2", "", this.copy.reviewTitle), text("p", "", this.copy.reviewHelp));
  const list = text("div", "review-list");
  this.visibleFields().forEach(([name, field]) => {
    const row = text("div", "review-row");
    const answer = text("span", "review-answer");
    answer.append(text("small", "", field.label), text("strong", "", this.displayValue(this.values[name], field.definition)));
    const change2 = text("button", "review-change", this.copy.changeAnswer);
    change2.type = "button";
    change2.addEventListener("click", () => this.goToGuidedQuestion(name));
    row.append(answer, change2);
    list.append(row);
  });
  const actions = text("div", "guided-review-actions");
  const readiness = text("div", "guided-review-readiness");
  const back = text("button", "secondary-action", this.copy.back);
  back.type = "button";
  back.addEventListener("click", () => this.guidedPrevious());
  readiness.append(this.validationNavigator);
  actions.append(back, this.submitButton);
  this.guidedReview.append(head);
  this.guidedReview.append(list);
  this.guidedReview.append(this.renderPrivacy(), readiness, actions);
  this.updateSubmitState();
}

// src/form/experiences/determination.js
function renderDetermination() {
  const layout = text("div", "determination-layout");
  const facts = text("section", "determination-facts");
  const head = text("header", "experience-head");
  head.append(text("span", "eyebrow", this.copy.determinationFacts), text("h2", "", this.copy.determinationTitle), text("p", "", this.copy.determinationHelp));
  this.determinationActivity = text("div", "determination-activity");
  this.determinationActivity.append(text("i", ""), text("span", "", this.copy.determinationPreparing));
  facts.append(head, this.fieldList, this.determinationActivity);
  layout.append(facts);
  const wrap = text("div", "determination");
  wrap.append(layout, this.renderActions());
  return wrap;
}
function refreshDetermination() {
}

// src/form/experiences/checklist.js
function renderChecklist() {
  const checklist = text("div", "checklist");
  const head = text("header", "checklist-head");
  const copy = text("div", "checklist-title");
  copy.append(text("span", "eyebrow", this.copy.checklistEyebrow), text("h2", "", this.copy.checklistTitle), text("p", "", this.copy.checklistHelp));
  this.checklistProgress = text("div", "checklist-progress");
  head.append(copy);
  const context = text("section", "checklist-section");
  const controls = text("section", "checklist-section checklist-controls");
  const contextFields = [];
  const controlFields = [];
  for (const [, field] of this.fields) {
    if (["boolean", "attestation"].includes(field.definition.type)) controlFields.push(field.wrap);
    else contextFields.push(field.wrap);
  }
  if (contextFields.length) {
    const contextHead = text("header", "checklist-section-head");
    contextHead.append(text("span", "eyebrow", this.copy.checklistContext), text("h3", "", this.copy.checklistContextTitle), text("p", "", this.copy.checklistContextHelp));
    context.append(contextHead);
    const grid = text("div", "checklist-context-grid");
    grid.append(...contextFields);
    context.append(grid);
  }
  const controlsHead = text("header", "checklist-section-head");
  controlsHead.append(text("span", "eyebrow", this.copy.checklistControlsLabel), text("h3", "", this.copy.checklistControls), text("p", "", this.copy.checklistControlsHelp));
  controls.append(controlsHead);
  const list = text("div", "checklist-control-list");
  list.append(...controlFields);
  controls.append(list);
  checklist.append(head);
  if (contextFields.length) checklist.append(context);
  const completion = this.renderActions();
  completion.classList.add("checklist-completion");
  completion.prepend(this.checklistProgress);
  checklist.append(controls, completion);
  this.updateChecklistProgress();
  return checklist;
}
function checklistControlNames() {
  return [...this.fields.entries()].filter(([, field]) => field.engineVisible !== false && ["boolean", "attestation"].includes(field.definition.type)).map(([name]) => name);
}
function updateChecklistProgress() {
  if (!this.checklistProgress) return;
  const names = this.checklistControlNames();
  const reviewed = names.filter((name) => this.reviewed.has(name)).length;
  this.checklistProgress.replaceChildren(
    text("strong", "", `${reviewed}/${names.length}`),
    text("span", "", this.copy.checklistProgress(reviewed, names.length))
  );
  if (this.progressEnabled()) {
    const rail = text("div", "checklist-progress-rail");
    const fill = text("i", "");
    fill.style.width = `${names.length ? Math.round(reviewed / names.length * 100) : 100}%`;
    rail.append(fill);
    this.checklistProgress.append(rail);
  }
}
function setChecklistBoolean(name, value) {
  const field = this.fields.get(name);
  if (!field) return;
  const firstReview = !this.reviewed.has(name);
  this.reviewed.add(name);
  field.control.value = String(value);
  field.choiceButtons?.yes.classList.toggle("selected", value === true);
  field.choiceButtons?.no.classList.toggle("selected", value === false);
  field.choiceButtons?.yes.setAttribute("aria-pressed", String(value === true));
  field.choiceButtons?.no.setAttribute("aria-pressed", String(value === false));
  this.clearStaleFieldEvaluation(name);
  this.updateChecklistProgress();
  if (Object.is(this.values[name], value)) {
    this.updateSubmitState();
    if (firstReview) {
      this.emit("change", { name, value, values: { ...this.values } });
      this.scheduleValidation(0, [name]);
    }
    return;
  }
  this.values[name] = value;
  this.updateAnswerProgress();
  this.valid = false;
  this.updateSubmitState();
  this.setStatus("checking", this.copy.checking);
  this.emit("change", { name, value, values: { ...this.values } });
  this.invalidateStaleValidationRequest();
  this.scheduleValidation(0, [name]);
}

// src/form/validation/navigation-state.js
function validationProblems() {
  const { fingerprint } = this.validationRequest();
  const localIssues = this.localValidationIssues(null, { includeRequired: true }).filter((issue) => issue?.severity === "error");
  const problems = [];
  const seenFields = /* @__PURE__ */ new Set();
  const add = (issue, kind = "attention") => {
    const name = issue?.field_id || "";
    if (name) {
      const field = this.fields.get(name);
      if (!field || field.engineVisible === false || seenFields.has(name)) return;
      seenFields.add(name);
    }
    problems.push({ issue, name, kind });
  };
  for (const issue of localIssues) {
    const missing = issue.kind === "missing_required" || issue.kind === "attestation_incomplete";
    add(issue, missing ? "missing" : "attention");
  }
  if (this.flowType === "checklist") {
    for (const name of this.checklistControlNames()) {
      if (!this.reviewed.has(name)) add({ field_id: name, severity: "error", kind: "missing_required", local: true }, "missing");
    }
  }
  if (this.lastValidationFingerprint === fingerprint) {
    for (const issue of this.lastValidation?.issues || []) {
      if (issue?.severity === "error") add(issue, "attention");
    }
    if (this.lastValidation?.valid === false && problems.length === 0) add({ severity: "error" }, "attention");
  }
  return problems;
}
function validationNavigatorState() {
  if (!this.manifest) return { state: "checking", count: 0, label: this.copy.checkingAnswers, detail: "" };
  const problems = this.validationProblems();
  if (problems.length) {
    const needsAttention = problems.some((problem) => problem.kind === "attention");
    return {
      state: needsAttention ? "attention" : "needed",
      count: problems.length,
      label: needsAttention ? this.copy.answersNeedAttention(problems.length) : this.copy.answersNeeded(problems.length),
      detail: needsAttention ? this.copy.goToFirstAttention : this.copy.goToFirstUnfinished,
      problems
    };
  }
  const { fingerprint } = this.validationRequest();
  const currentResult = this.lastValidationFingerprint === fingerprint ? this.lastValidation : null;
  if (this.validationScheduled || this.validationInFlight || !currentResult) {
    return { state: "checking", count: 0, label: this.copy.checkingAnswers, detail: this.copy.checkingAnswersHelp, problems: [] };
  }
  if (currentResult.valid === true) {
    return { state: "ready", count: 0, label: this.copy.readyToComplete, detail: this.copy.answersChecked, problems: [] };
  }
  return {
    state: "attention",
    count: 1,
    label: this.copy.answersNeedAttention(1),
    detail: this.copy.goToFirstAttention,
    problems: [{ issue: { severity: "error" }, name: "", kind: "attention" }]
  };
}

// src/form/validation/navigation.js
function renderValidationNavigator() {
  const wrap = text("div", "validation-navigator-slot");
  const navigator = text("div", "validation-navigator");
  navigator.dataset.open = "false";
  navigator.dataset.state = "checking";
  const id = `proseid-answer-status-${this.recordId}`;
  const toggle = text("button", "validation-orb");
  toggle.type = "button";
  toggle.setAttribute("aria-controls", id);
  toggle.setAttribute("aria-expanded", "false");
  this.validationOrbValue = text("span", "validation-orb-value");
  this.validationOrbValue.setAttribute("aria-hidden", "true");
  toggle.append(this.validationOrbValue);
  const reveal = text("div", "validation-reveal");
  reveal.id = id;
  const jump = text("button", "validation-jump");
  jump.type = "button";
  this.validationCopy = text("span", "validation-copy");
  this.validationLabel = text("strong", "validation-label");
  this.validationLabel.setAttribute("aria-live", "polite");
  this.validationDetail = text("small", "validation-detail");
  this.validationCopy.append(this.validationLabel, this.validationDetail);
  this.validationArrow = text("span", "validation-arrow", "\u2192");
  this.validationArrow.setAttribute("aria-hidden", "true");
  jump.append(this.validationCopy, this.validationArrow);
  reveal.append(jump);
  navigator.append(reveal, toggle);
  wrap.append(navigator);
  toggle.addEventListener("click", () => {
    this.validationNavigatorOpen = !this.validationNavigatorOpen;
    this.updateValidationNavigator();
  });
  jump.addEventListener("click", () => {
    const state = this.validationNavigatorState();
    if (state.problems?.length) this.navigateToFirstProblem(state.problems);
    this.validationNavigatorOpen = false;
    this.updateValidationNavigator();
  });
  return wrap;
}
function updateValidationNavigator() {
  const navigator = this.validationNavigator?.querySelector?.(".validation-navigator");
  const toggle = navigator?.querySelector?.(".validation-orb");
  const jump = navigator?.querySelector?.(".validation-jump");
  const reveal = navigator?.querySelector?.(".validation-reveal");
  if (!navigator || !toggle || !jump || !reveal) return;
  const state = this.validationNavigatorState();
  navigator.dataset.state = state.state;
  navigator.dataset.open = String(this.validationNavigatorOpen);
  toggle.setAttribute("aria-expanded", String(this.validationNavigatorOpen));
  reveal.setAttribute("aria-hidden", String(!this.validationNavigatorOpen));
  jump.tabIndex = this.validationNavigatorOpen ? 0 : -1;
  toggle.setAttribute("aria-label", this.validationNavigatorOpen ? this.copy.closeAnswerNavigator : `${this.copy.openAnswerNavigator}: ${state.label}`);
  this.validationOrbValue.textContent = state.state === "ready" ? "\u2713" : state.state === "checking" ? "" : state.count > 99 ? "99+" : String(state.count);
  this.validationLabel.textContent = state.label;
  this.validationDetail.textContent = state.detail;
  jump.setAttribute("aria-label", state.problems?.length ? `${state.label}. ${state.detail}` : state.label);
  this.validationArrow.textContent = state.problems?.length ? "\u2192" : state.state === "ready" ? "\u2713" : "\xB7";
}
async function navigateToFirstProblem(problems = this.validationProblems()) {
  const orderedNames = this.visibleFields().map(([name]) => name);
  const named = problems.filter((problem) => problem.name);
  named.sort((a, b) => orderedNames.indexOf(a.name) - orderedNames.indexOf(b.name));
  const target = named[0];
  if (!target) {
    this.submittedAttempted = true;
    this.renderIssues(this.lastValidation?.issues || []);
    this.formError?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    return;
  }
  this.blurred.add(target.name);
  const localIssues = this.localValidationIssues([target.name], { includeRequired: true });
  this.renderLocalIssues([target.name], localIssues);
  if (this.flowType === "guided_assessment") this.goToGuidedQuestion(target.name);
  const field = this.fields.get(target.name);
  field?.wrap?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  const controls = field?.controls || [field?.control];
  (controls.find((control) => control?.checked) || controls.find((control) => control && control.type !== "hidden"))?.focus?.({ preventScroll: true });
}
async function focusFirstInvalid(result = this.lastValidation) {
  const issues = (result?.issues || []).filter((issue) => issue?.severity === "error" && issue?.field_id);
  let name = issues.find((issue) => this.fields.get(issue.field_id)?.engineVisible !== false)?.field_id;
  if (!name) {
    name = this.visibleFields().find(
      ([fieldName, field2]) => field2.definition?.required === true && !answerProvided(field2.definition, this.values[fieldName])
    )?.[0];
  }
  if (!name) return;
  if (this.flowType === "guided_assessment") {
    this.guidedPhase = "questions";
    this.guidedReview.hidden = true;
    this.guidedQuestion.hidden = false;
    this.guidedPath.hidden = false;
    this.guidedIndex = Math.max(0, this.visibleFields().findIndex(([fieldName]) => fieldName === name));
    this.refreshGuided();
  }
  const field = this.fields.get(name);
  field?.wrap?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  (field?.controls || [field?.control]).find((control) => control && control.type !== "hidden")?.focus?.({ preventScroll: true });
}

// src/form/controls/date-values.js
var isoParts = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? { year, month, day } : null;
};
var iso = (year, month, day) => `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

// src/form/controls/date-picker.js
function renderDatePicker(id, definition, labelText) {
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
  trigger.setAttribute("aria-label", this.copy.chooseDateFor(labelText));
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-expanded", "false");
  trigger.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M3.5 9.5h17"/></svg>';
  wrap.append(input, trigger);
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
  const monthTitle = () => new Intl.DateTimeFormat(this.locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(viewYear, viewMonth - 1, 1)));
  const monthName = () => new Intl.DateTimeFormat(this.locale, { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(viewYear, viewMonth - 1, 1)));
  const yearOptions = () => {
    const minimumYear = isoParts(String(definition.min || ""))?.year ?? today.getFullYear() - 100;
    const maximumYear = isoParts(String(definition.max || ""))?.year ?? today.getFullYear() + 25;
    const firstYear = Math.min(minimumYear, viewYear);
    const lastYear = Math.max(maximumYear, viewYear);
    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
  };
  const displayDate = (value) => {
    const parsed = isoParts(value);
    if (!parsed) return value;
    return new Intl.DateTimeFormat(this.locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day)));
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
    const period = text("div", "date-panel-period");
    const yearSelect = document.createElement("select");
    yearSelect.className = "date-year-select";
    yearSelect.setAttribute("aria-label", this.copy.year);
    for (const year of yearOptions()) {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      yearSelect.append(option);
    }
    yearSelect.value = String(viewYear);
    yearSelect.addEventListener("change", () => {
      viewYear = Number(yearSelect.value);
      renderPanel();
      place();
    });
    period.append(text("strong", "", monthName()), yearSelect);
    title.append(text("span", "", this.copy.selectDate), period);
    const navigation = text("nav", "date-navigation");
    navigation.setAttribute("aria-label", "Change month");
    const previous = text("button", "", "\u2039");
    previous.type = "button";
    previous.setAttribute("aria-label", this.copy.previousMonth);
    const next = text("button", "", "\u203A");
    next.type = "button";
    next.setAttribute("aria-label", this.copy.nextMonth);
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
    for (const day of this.copy.weekdays) weekdays.append(text("span", "", day));
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
    const clearButton = text("button", "", this.copy.clear);
    clearButton.type = "button";
    clearButton.disabled = !input.value;
    clearButton.addEventListener("click", clear);
    const todayButton = text("button", "today-action", this.copy.today);
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
    panel.setAttribute("aria-label", this.copy.chooseDateFor(labelText));
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

// src/form/controls/field.js
function renderField(name, definition) {
  const wrap = text("div", "field");
  wrap.dataset.fieldName = name;
  if (["highlight", "error", "warning", "success", "muted"].includes(definition.ui_class)) wrap.classList.add(definition.ui_class);
  wrap.hidden = definition.visible === false;
  const labelText = humanizeText(definition.label || definition.statement || name);
  const id = `proseid-${this.recordId.slice(-10)}-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  let control;
  let controls = [];
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
    control.value = this.values[name] === void 0 ? "" : String(this.values[name]);
    controls = [control];
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
  } else if (definition.type === "boolean") {
    const group = document.createElement("fieldset");
    group.className = "boolean-field";
    const legend = text("legend", "sr-only", labelText);
    const row = text("div", "boolean-row");
    const copy = text("div", "boolean-copy", labelText);
    copy.append(required);
    if (info) copy.append(info);
    const choices = text("div", "boolean-choice");
    choices.setAttribute("role", "radiogroup");
    const yesLabel = document.createElement("label");
    const noLabel = document.createElement("label");
    const yes = document.createElement("input");
    const no = document.createElement("input");
    yes.type = no.type = "radio";
    yes.name = no.name = name;
    yes.value = "true";
    no.value = "false";
    yes.checked = this.values[name] === true;
    no.checked = this.values[name] === false;
    yesLabel.classList.toggle("selected", yes.checked);
    noLabel.classList.toggle("selected", no.checked);
    yesLabel.append(yes, text("span", "", this.copy.yes));
    noLabel.append(no, text("span", "", this.copy.no));
    choices.append(yesLabel, noLabel);
    row.append(copy, choices);
    group.append(legend, row);
    wrap.append(group);
    control = yes;
    controls = [yes, no];
    wrap.choiceLabels = { yes: yesLabel, no: noLabel };
  } else if (definition.type === "attestation") {
    const label = text("label", "check");
    control = document.createElement("input");
    control.type = "checkbox";
    control.checked = this.values[name] === true;
    control.setAttribute("role", "switch");
    controls = [control];
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
      empty.disabled = true;
      control.append(empty);
      for (const option of definition.options || []) {
        const value = typeof option === "object" ? option.value : option;
        const item = text("option", "", humanizeChoice(typeof option === "object" ? option.label || value : value));
        item.value = value;
        control.append(item);
      }
    } else if (definition.type === "date") {
      const datePicker = this.renderDatePicker(id, definition, labelText);
      control = datePicker.input;
      wrap.append(datePicker.wrap);
    } else if (definition.multiline) {
      control = document.createElement("textarea");
      control.rows = 5;
    } else {
      control = document.createElement("input");
      control.type = ["number", "currency"].includes(definition.type) ? "number" : definition.format === "email" ? "email" : "text";
      if (definition.step != null) control.step = definition.step;
      else if (definition.type === "currency") control.step = "0.01";
    }
    controls = [control];
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
  for (const item of controls) {
    item.name = name;
    item.required = definition.required === true;
  }
  const message = text("span", "field-message", definition.ui_message || "");
  message.id = messageId;
  message.hidden = !definition.ui_message;
  wrap.append(message);
  const describedBy = [definition.info ? infoId : "", definition.description || definition.help ? hintId : "", messageId, `${id}-error`].filter(Boolean);
  for (const item of controls) {
    item.setAttribute("aria-describedby", describedBy.join(" "));
    item.addEventListener("input", () => this.change(name, definition, item));
    item.addEventListener("change", () => this.change(name, definition, item, true));
    item.addEventListener("blur", () => {
      this.blurred.add(name);
      this.scheduleValidation(120, [name], { includeRequired: true });
    });
  }
  const error = text("span", "error");
  error.id = `${id}-error`;
  error.setAttribute("aria-live", "polite");
  wrap.append(error);
  this.fields.set(name, {
    wrap,
    control,
    controls,
    error,
    message,
    required,
    definition,
    label: labelText,
    engineVisible: definition.visible !== false,
    choiceButtons: wrap.choiceButtons || null,
    choiceLabels: wrap.choiceLabels || null
  });
  return wrap;
}

// src/form/validation/answers.js
function change(name, definition, control, immediate = false) {
  const wasProvided = answerProvided(definition, this.values[name]);
  const value = definition.type === "boolean" ? control.type === "radio" ? control.value === "true" : control.checked : definition.type === "attestation" ? control.checked : ["number", "currency"].includes(definition.type) && control.value !== "" ? Number(control.value) : control.value;
  if (this.flowType === "checklist" && ["boolean", "attestation"].includes(definition.type)) {
    this.reviewed.add(name);
    this.updateChecklistProgress();
  }
  if (Object.is(this.values[name], value)) {
    this.updateSubmitState();
    return;
  }
  this.values[name] = value;
  const isProvided = answerProvided(definition, value);
  this.updateAnswerProgress();
  if (definition.type === "boolean") {
    const field = this.fields.get(name);
    field?.choiceLabels?.yes.classList.toggle("selected", value === true);
    field?.choiceLabels?.no.classList.toggle("selected", value === false);
  }
  this.valid = false;
  if (this.flowType === "checklist" && ["boolean", "attestation"].includes(definition.type)) this.clearStaleFieldEvaluation(name);
  if (this.flowType === "determination" && this.determinationActivity) {
    this.determinationActivity.classList.add("evaluating");
    this.determinationActivity.querySelector("span").textContent = this.copy.determinationUpdating;
  }
  if (this.flowType === "guided_assessment" && this.guidedPhase === "questions" && wasProvided !== isProvided) this.refreshGuided();
  this.updateSubmitState();
  this.setStatus("checking", this.copy.checking);
  this.emit("change", { name, value: this.values[name], values: { ...this.values } });
  this.invalidateStaleValidationRequest();
  const activeDefinition = this.fields.get(name)?.definition || definition;
  const locallyValid = answerProvided(activeDefinition, value) && !localConstraintIssue(name, activeDefinition, value, { includeRequired: true });
  const validationDelay = immediate ? 0 : this.options.validateDelay ?? (locallyValid ? LOCALLY_VALID_VALIDATION_DELAY : DEFAULT_VALIDATION_DELAY);
  this.scheduleValidation(validationDelay, [name]);
}
var DEFAULT_VALIDATION_DELAY = 400;
var LOCALLY_VALID_VALIDATION_DELAY = 180;

// src/form/validation/request.js
var normalizedResponses = (definitions, values) => Object.fromEntries(
  Object.entries(values).map(([name, value]) => {
    const definition = definitions?.[name];
    if (value === "" && ["select", "date", "number", "currency"].includes(definition?.type)) return [name, void 0];
    return [name, value];
  })
);
function validationRequest() {
  const responses = normalizedResponses(this.manifest.schema?.definitions || {}, this.values);
  const fingerprint = JSON.stringify([
    this.manifest.flow.ref,
    this.manifest.flow.effectiveAt,
    responses
  ]);
  return { responses, fingerprint };
}
function invalidateStaleValidationRequest() {
  if (!this.validationPromise) return;
  const { fingerprint } = this.validationRequest();
  if (fingerprint === this.validationPromiseFingerprint) return;
  this.validationSequence += 1;
  this.validationAbort?.abort();
  this.validationAbort = null;
  this.validationPromise = null;
  this.validationPromiseFingerprint = "";
  this.validationInFlight = false;
  this.updateValidationNavigator();
}
function scheduleValidation(delay, names = null, { includeRequired = false } = {}) {
  clearTimeout(this.validationTimer);
  this.validationScheduled = true;
  this.updateValidationNavigator();
  this.validationTimer = setTimeout(() => {
    this.validationScheduled = false;
    const localIssues = names?.length ? this.localValidationIssues(names, { includeRequired }) : [];
    if (names?.length) this.renderLocalIssues(names, localIssues);
    if (localIssues.some((issue) => issue.severity === "error")) {
      this.valid = false;
      this.updateSubmitState();
      this.setStatus("idle", this.copy.incomplete);
      return;
    }
    this.validate();
  }, Math.max(0, delay));
}

// src/form/validation/local-issues.js
function localValidationIssues(names, { includeRequired = false } = {}) {
  const selected = names ? new Set(names) : null;
  const issues = [];
  for (const [name, field] of this.fields) {
    if (selected && !selected.has(name)) continue;
    if (field.engineVisible === false) continue;
    const issue = localConstraintIssue(name, field.definition, this.values[name], { includeRequired });
    if (issue) issues.push(issue);
  }
  return issues;
}
function renderLocalIssues(names, issues = this.localValidationIssues(names)) {
  const selected = new Set(names || []);
  const retained = (this.lastValidation?.issues || []).filter((issue) => !selected.has(issue?.field_id));
  this.renderIssues([...retained, ...issues]);
}

// src/form/validation/remote.js
async function validate() {
  if (this.destroyed || !this.manifest) return null;
  const { responses, fingerprint } = this.validationRequest();
  if (this.lastValidation && this.lastValidationFingerprint === fingerprint) {
    this.validationScheduled = false;
    this.renderIssues(this.lastValidation.issues || []);
    this.updateSubmitState();
    return this.lastValidation;
  }
  if (this.validationPromise && this.validationPromiseFingerprint === fingerprint) {
    return this.validationPromise;
  }
  const sequence = ++this.validationSequence;
  this.validationScheduled = false;
  this.validationInFlight = true;
  this.validationAbort?.abort();
  this.validationAbort = new AbortController();
  this.setStatus("checking", this.copy.checking);
  const signal = this.validationAbort.signal;
  const request = (async () => {
    try {
      const result = await this.api.validate(
        this.manifest.flow.ref,
        responses,
        this.manifest.flow.effectiveAt,
        this.locale,
        signal
      );
      if (sequence !== this.validationSequence) return null;
      this.lastValidation = result;
      this.lastValidationFingerprint = fingerprint;
      this.valid = result.valid === true;
      this.validationLocked = false;
      this.applyDefinitions(result.definitions || {});
      this.renderIssues(result.issues || []);
      if (this.flowType === "determination") {
        this.determinationActivity?.classList.remove("evaluating");
        if (this.determinationActivity) this.determinationActivity.querySelector("span").textContent = this.copy.determinationAuto;
        this.refreshDetermination();
      }
      this.updateSubmitState();
      this.setStatus(this.valid ? "ready" : "idle", this.valid ? this.copy.ready : this.copy.incomplete);
      this.emit("validation", { valid: this.valid, status: result.status, issues: result.issues || [] });
      return result;
    } catch (error) {
      if (error?.name === "AbortError") return null;
      if (sequence !== this.validationSequence) return null;
      this.valid = false;
      this.updateSubmitState();
      const message = errorMessage(error.code, this.copy.checkFailed);
      this.setStatus("error", message);
      if (error?.code === "flow_changed" && this.formError) {
        this.validationLocked = true;
        this.formError.hidden = false;
        this.formError.textContent = message;
        this.updateSubmitState();
      }
      this.emit("error", { error });
      return null;
    }
  })();
  this.validationPromise = request;
  this.validationPromiseFingerprint = fingerprint;
  this.updateValidationNavigator();
  try {
    return await request;
  } finally {
    if (this.validationPromise === request) {
      this.validationPromise = null;
      this.validationPromiseFingerprint = "";
      this.validationAbort = null;
      this.validationInFlight = false;
      this.updateValidationNavigator();
    }
  }
}

// src/form/validation/issue-copy.js
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

// src/form/validation/display.js
function applyDefinitions(definitions) {
  for (const [name, resolved] of Object.entries(definitions)) {
    const field = this.fields.get(name);
    if (!field) continue;
    field.engineVisible = resolved?.visible !== false;
    field.definition = { ...field.definition, ...resolved };
    field.wrap.hidden = !field.engineVisible;
    const required = resolved?.required === true;
    for (const control of field.controls || [field.control]) control.required = required;
    field.required.hidden = !required;
    field.message.textContent = resolved?.ui_message || "";
    field.message.hidden = !resolved?.ui_message;
  }
  if (this.flowType === "guided_assessment" && this.guidedPhase === "questions") this.refreshGuided();
  if (this.flowType === "checklist") this.updateChecklistProgress();
  this.updateAnswerProgress();
  this.updateValidationNavigator();
}
function clearStaleFieldEvaluation(name) {
  const field = this.fields.get(name);
  if (!field) return;
  field.error.textContent = "";
  field.message.textContent = this.manifest.schema?.definitions?.[name]?.ui_message || "";
  field.message.hidden = !field.message.textContent;
}
function shouldShow(issue) {
  if (this.submittedAttempted) return true;
  if (issue?.local === true && !isEmptyValue(this.fields.get(issue.field_id)?.definition, this.values[issue.field_id])) return true;
  if (issue?.trigger === "completion") return false;
  if (issue?.trigger === "correction") return this.blurred.has(issue.field_id);
  return issue?.severity === "warning" || issue?.severity === "notice";
}
function renderIssues(issues) {
  for (const field of this.fields.values()) {
    field.error.textContent = "";
    for (const control of field.controls || [field.control]) control.setAttribute("aria-invalid", "false");
  }
  const formIssues = [];
  for (const issue of issues) {
    if (!this.shouldShow(issue)) continue;
    const field = this.fields.get(issue.field_id);
    if (field) {
      field.error.textContent = friendlyIssue(issue, field.label, this.copy);
      for (const control of field.controls || [field.control]) control.setAttribute("aria-invalid", "true");
    } else formIssues.push(friendlyIssue(issue, "This field", this.copy));
  }
  if (this.submittedAttempted && this.flowType === "checklist") {
    for (const name of this.checklistControlNames()) {
      if (this.reviewed.has(name)) continue;
      const field = this.fields.get(name);
      if (!field || field.error.textContent) continue;
      field.error.textContent = this.copy.checklistChoose;
      for (const control of field.controls || [field.control]) control.setAttribute("aria-invalid", "true");
    }
  }
  this.formError.textContent = formIssues.join(" ");
  this.formError.hidden = formIssues.length === 0;
}

// src/form/completion/signature.js
function collectBasicSignature() {
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
    const acknowledgementTrack = text("span", "signature-toggle");
    acknowledgementTrack.setAttribute("aria-hidden", "true");
    acknowledgement.append(checkbox, acknowledgementTrack, text("span", "", this.copy.signatureAcknowledgement));
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

// src/form/completion/submit.js
async function submit(event) {
  event.preventDefault();
  if (this.destroyed || this.submitting) return;
  clearTimeout(this.validationTimer);
  this.validationScheduled = false;
  this.submittedAttempted = true;
  const localIssues = this.localValidationIssues(null, { includeRequired: true });
  if (localIssues.some((issue) => issue.severity === "error")) {
    const { fingerprint } = this.validationRequest();
    const currentServerIssues = this.lastValidationFingerprint === fingerprint ? this.lastValidation?.issues || [] : [];
    this.renderIssues([...currentServerIssues, ...localIssues]);
    this.validationNavigatorOpen = true;
    this.updateValidationNavigator();
    await this.navigateToFirstProblem(this.validationProblems());
    return;
  }
  if (this.flowType === "checklist") {
    const firstUnreviewed = this.checklistControlNames().find((name) => !this.reviewed.has(name));
    if (firstUnreviewed) {
      this.renderIssues(this.lastValidation?.issues || []);
      const field = this.fields.get(firstUnreviewed);
      field?.wrap?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      field?.choiceButtons?.yes?.focus?.({ preventScroll: true });
      return;
    }
  }
  const validation = this.valid && this.lastValidation ? this.lastValidation : await this.validate();
  if (!validation?.valid) {
    this.renderIssues(validation?.issues || []);
    this.refreshDetermination();
    await this.focusFirstInvalid(validation);
    return;
  }
  this.submitting = true;
  this.submitButton.disabled = true;
  this.setButtonBusy(this.submitButton, true, this.copy.submitting);
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
          this.submitting = false;
          this.updateSubmitState();
          this.setButtonBusy(this.submitButton, false, this.options.submitLabel || this.defaultSubmitLabel());
          this.setStatus("ready", this.copy.ready);
          return;
        }
        this.emit("signing", { mode, signature });
      } else {
        const nextAction = await this.api.prepareSigning(
          this.manifest.flow.ref,
          this.recordId,
          this.values,
          this.manifest.flow.effectiveAt
        );
        signature = await this.signing.handle(nextAction, { manifest: this.manifest, values: { ...this.values } });
        this.emit("signing", { mode, nextAction, signature });
      }
    }
    const result = await this.api.complete(
      this.manifest.flow.ref,
      this.recordId,
      normalizedResponses(this.manifest.schema?.definitions || {}, this.values),
      this.manifest.flow.effectiveAt,
      signature,
      this.locale
    );
    this.renderComplete(result);
    this.emit("complete", result);
  } catch (error) {
    this.submitting = false;
    if (error?.code === "validation_failed" && Array.isArray(error?.details?.issues)) {
      this.valid = false;
      this.lastValidation = {
        ...this.lastValidation || {},
        valid: false,
        status: error.details.status || "INVALID",
        issues: error.details.issues
      };
      this.renderIssues(error.details.issues);
      this.refreshDetermination();
      await this.focusFirstInvalid(this.lastValidation);
    }
    this.updateSubmitState();
    this.setButtonBusy(this.submitButton, false, this.options.submitLabel || this.defaultSubmitLabel());
    this.formError.hidden = false;
    this.formError.textContent = errorMessage(error.code, error.message);
    this.setStatus("error", "Submission not saved");
    this.emit("error", { error });
  }
}

// src/form/completion/result.js
function renderComplete(result) {
  for (const cleanup of this.cleanupFns.splice(0)) cleanup();
  const shell = this.shadow.querySelector(".shell");
  const complete = text("div", "completion-view");
  const summary = text("header", "completion-summary");
  const summaryCopy = text("div", "completion-summary-copy");
  summaryCopy.append(
    text("h2", "", result.test ? this.copy.testCompleteTitle : this.copy.completeTitle),
    text("p", "", result.test ? this.copy.testDelivered : this.copy.delivered(this.manifest.publisher.name)),
    text("div", "receipt", result.test ? this.copy.testRecord(result.recordId) : this.copy.auditRecord(result.recordId))
  );
  summary.append(text("div", "seal", "\u2713"), summaryCopy);
  complete.append(summary);
  const recordedResult = this.renderRecordedResult(result.result);
  if (recordedResult) complete.append(recordedResult);
  if (result.test) {
    complete.append(text("p", "receipt-test", this.copy.receiptTest));
  } else if (this.manifest.capabilities?.receiptEmail !== false) {
    complete.append(this.renderReceiptEmail(result));
  }
  const ledger = this.renderLedger("complete");
  shell.replaceChildren(...ledger ? [ledger, complete] : [complete]);
  if (this.options.autoFocusCompletion !== false) {
    requestAnimationFrame(() => {
      if (this.destroyed) return;
      const reduceMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      this.target.scrollIntoView?.({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  }
}
function renderRecordedResult(result) {
  const outcomes = Array.isArray(result?.outcomes) ? result.outcomes : [];
  const notices = Array.isArray(result?.notices) ? result.notices : [];
  if (!outcomes.length && !notices.length) return null;
  const section = text("section", "recorded-result");
  const title = this.flowType === "determination" ? this.copy.resultDetermination : this.flowType === "guided_assessment" ? this.copy.resultAssessment : this.flowType === "checklist" ? this.copy.resultChecklist : this.copy.resultForm;
  const head = text("header", "recorded-result-head");
  head.append(text("span", "eyebrow", this.copy.resultEyebrow), text("h3", "", title), text("p", "", this.copy.resultHelp));
  section.append(head);
  if (outcomes.length) {
    const list = text("div", "recorded-outcomes");
    for (const outcome of outcomes) {
      if (!outcome || !String(outcome.fieldId || "").trim()) continue;
      const item = text("article", "recorded-outcome");
      item.append(
        text("small", "", humanizeText(outcome.label || outcome.fieldId)),
        text("strong", "", this.displayValue(outcome.value, { type: outcome.type }))
      );
      if (outcome.message) item.append(text("p", "", String(outcome.message)));
      list.append(item);
    }
    if (list.childElementCount) section.append(list);
  }
  if (notices.length) {
    const notes = text("div", "recorded-notices");
    notes.append(text("span", "eyebrow", this.copy.resultNotes));
    const list = document.createElement("ul");
    for (const notice of notices) if (notice?.message) list.append(text("li", "", String(notice.message)));
    if (list.childElementCount) notes.append(list);
    section.append(notes);
  }
  return section;
}

// src/form/completion/receipt.js
function renderReceiptEmail(result) {
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
async function sendReceipt(event, { result, input, button, status }) {
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
  this.setButtonBusy(button, true, this.copy.receiptSending);
  status.dataset.state = "idle";
  status.textContent = "";
  try {
    await this.api.emailReceipt(this.manifest.flow.ref, result.recordId, email);
    status.dataset.state = "sent";
    status.textContent = this.copy.receiptSent(email);
    this.setButtonBusy(button, false, this.copy.receiptAction);
    this.emit("receipt", { status: "sent", recordId: result.recordId, email });
  } catch (error) {
    input.disabled = false;
    button.disabled = false;
    this.setButtonBusy(button, false, this.copy.receiptAction);
    status.dataset.state = "error";
    status.textContent = error?.code === "rate_limited" ? this.copy.receiptRateLimited : this.copy.receiptError;
    this.emit("receipt", { status: "error", recordId: result.recordId, email, error });
  }
}

// src/ProseIDForm.js
var randomRecordId = () => `embed_${globalThis.crypto?.randomUUID?.().replaceAll("-", "") || Math.random().toString(36).slice(2).padEnd(16, "0")}`;
var RECORD_ID_RE = /^[A-Za-z0-9_-]{4,128}$/;
var ProseIDForm = class {
  constructor(target, options) {
    this.target = typeof target === "string" ? document.querySelector(target) : target;
    if (!(this.target instanceof Element)) throw new ProseIDError("invalid_target", "Choose an element to contain the ProseID form.");
    if (!options?.flow && !options?.testMode) throw new ProseIDError("invalid_flow", "The Flow ID is required.");
    if (!options?.transport && !options?.apiKey) throw new ProseIDError("invalid_api_key", "A ProseID publishable key is required.");
    this.options = options;
    this.explicitLocale = options.locale ? normalizeLocale(options.locale) : "";
    this.locale = this.explicitLocale || readLocalePreference() || "en";
    this.copy = messagesFor(this.locale, options.messages);
    this.attribution = normalizeAttribution(options.branding?.proseid);
    this.api = options.transport || new EmbedApi({
      apiBase: options.apiBase,
      apiKey: options.apiKey,
      flow: options.flow,
      testMode: options.testMode === true,
      attribution: this.attribution,
      parentOrigin: options.parentOrigin || globalThis.location?.origin || "",
      fetchImpl: options.fetch
    });
    for (const method of ["manifest", "validate", "complete"]) {
      if (typeof this.api?.[method] !== "function") {
        throw new ProseIDError("invalid_transport", `The Flow transport must provide a ${method}() method.`);
      }
    }
    this.signing = new SigningCoordinator(options.signingAdapter);
    this.shadow = this.target.shadowRoot || this.target.attachShadow({ mode: "open" });
    this.values = {};
    this.fields = /* @__PURE__ */ new Map();
    this.blurred = /* @__PURE__ */ new Set();
    this.reviewed = /* @__PURE__ */ new Set();
    this.submittedAttempted = false;
    this.valid = false;
    this.guidedPhase = "questions";
    this.guidedIndex = 0;
    this.guidedChecking = false;
    this.destroyed = false;
    this.validationTimer = null;
    this.validationAbort = null;
    this.validationSequence = 0;
    this.validationPromise = null;
    this.validationPromiseFingerprint = "";
    this.lastValidationFingerprint = "";
    this.validationScheduled = false;
    this.validationInFlight = false;
    this.validationNavigatorOpen = false;
    this.submitting = false;
    this.validationLocked = false;
    this.cleanupFns = [];
    const requestedRecordId = String(options.recordId || "").trim();
    if (requestedRecordId && !RECORD_ID_RE.test(requestedRecordId)) {
      throw new ProseIDError("invalid_record_id", "Use a valid Flow attempt ID.");
    }
    this.recordId = requestedRecordId || randomRecordId();
    this.applyAppearance(options.appearance);
    this.applyTheme(options.theme);
    this.renderLoading();
    this.ready = this.load();
  }
  applyTheme(theme = void 0, manifestColors = void 0) {
    return applyTheme.call(this, theme, manifestColors);
  }
  applyAppearance(appearance) {
    return applyAppearance.call(this, appearance);
  }
  progressEnabled() {
    return progressEnabled.call(this);
  }
  renderLedger(className = void 0) {
    return renderLedger.call(this, className);
  }
  installStyles() {
    return installStyles.call(this);
  }
  renderLoading() {
    return renderLoading.call(this);
  }
  load() {
    return load.call(this);
  }
  seedValues() {
    return seedValues.call(this);
  }
  setLocale(locale) {
    return setLocale.call(this, locale);
  }
  renderLanguageSelector() {
    return renderLanguageSelector.call(this);
  }
  brand(publisher) {
    return brand.call(this, publisher);
  }
  registryUrl(path) {
    return registryUrl.call(this, path);
  }
  proseidBrand() {
    return proseidBrand.call(this);
  }
  renderSchemaDetails() {
    return renderSchemaDetails.call(this);
  }
  renderForm() {
    return renderForm.call(this);
  }
  defaultSubmitLabel() {
    return defaultSubmitLabel.call(this);
  }
  setButtonBusy(button, busy, label) {
    return setButtonBusy.call(this, button, busy, label);
  }
  renderPrivacy() {
    return renderPrivacy.call(this);
  }
  renderActions(options = void 0) {
    return renderActions.call(this, options);
  }
  visibleFields() {
    return visibleFields.call(this);
  }
  updateAnswerProgress() {
    return updateAnswerProgress.call(this);
  }
  displayValue(value, definition) {
    return displayValue.call(this, value, definition);
  }
  renderGuided() {
    return renderGuided.call(this);
  }
  refreshGuided() {
    return refreshGuided.call(this);
  }
  goToGuidedQuestion(name) {
    return goToGuidedQuestion.call(this, name);
  }
  guidedContinue() {
    return guidedContinue.call(this);
  }
  guidedPrevious() {
    return guidedPrevious.call(this);
  }
  showGuidedReview() {
    return showGuidedReview.call(this);
  }
  renderDetermination() {
    return renderDetermination.call(this);
  }
  refreshDetermination() {
    return refreshDetermination.call(this);
  }
  renderChecklist() {
    return renderChecklist.call(this);
  }
  checklistControlNames() {
    return checklistControlNames.call(this);
  }
  updateChecklistProgress() {
    return updateChecklistProgress.call(this);
  }
  updateSubmitState() {
    return updateSubmitState.call(this);
  }
  validationProblems() {
    return validationProblems.call(this);
  }
  validationNavigatorState() {
    return validationNavigatorState.call(this);
  }
  renderValidationNavigator() {
    return renderValidationNavigator.call(this);
  }
  updateValidationNavigator() {
    return updateValidationNavigator.call(this);
  }
  navigateToFirstProblem(problems = void 0) {
    return navigateToFirstProblem.call(this, problems);
  }
  renderDatePicker(id, definition, labelText) {
    return renderDatePicker.call(this, id, definition, labelText);
  }
  renderField(name, definition) {
    return renderField.call(this, name, definition);
  }
  setChecklistBoolean(name, value) {
    return setChecklistBoolean.call(this, name, value);
  }
  change(name, definition, control, immediate = void 0) {
    return change.call(this, name, definition, control, immediate);
  }
  validationRequest() {
    return validationRequest.call(this);
  }
  invalidateStaleValidationRequest() {
    return invalidateStaleValidationRequest.call(this);
  }
  localValidationIssues(names, options = void 0) {
    return localValidationIssues.call(this, names, options);
  }
  renderLocalIssues(names, issues = void 0) {
    return renderLocalIssues.call(this, names, issues);
  }
  scheduleValidation(delay, names = void 0, options = void 0) {
    return scheduleValidation.call(this, delay, names, options);
  }
  validate() {
    return validate.call(this);
  }
  applyDefinitions(definitions) {
    return applyDefinitions.call(this, definitions);
  }
  clearStaleFieldEvaluation(name) {
    return clearStaleFieldEvaluation.call(this, name);
  }
  shouldShow(issue) {
    return shouldShow.call(this, issue);
  }
  renderIssues(issues) {
    return renderIssues.call(this, issues);
  }
  setStatus(state, copy) {
    return setStatus.call(this, state, copy);
  }
  collectBasicSignature() {
    return collectBasicSignature.call(this);
  }
  focusFirstInvalid(result = void 0) {
    return focusFirstInvalid.call(this, result);
  }
  submit(event) {
    return submit.call(this, event);
  }
  renderComplete(result) {
    return renderComplete.call(this, result);
  }
  renderRecordedResult(result) {
    return renderRecordedResult.call(this, result);
  }
  renderReceiptEmail(result) {
    return renderReceiptEmail.call(this, result);
  }
  sendReceipt(event, receipt) {
    return sendReceipt.call(this, event, receipt);
  }
  renderFatal(error) {
    return renderFatal.call(this, error);
  }
  emit(name, detail) {
    this.target.dispatchEvent(new CustomEvent(`proseid:${name}`, { detail, bubbles: true, composed: true }));
    const callback = this.options[`on${name[0].toUpperCase()}${name.slice(1)}`];
    if (typeof callback === "function") callback(name === "error" ? detail.error : detail);
  }
  destroy() {
    this.destroyed = true;
    this.validationSequence += 1;
    clearTimeout(this.validationTimer);
    this.validationScheduled = false;
    this.validationInFlight = false;
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
  COLOR_TOKEN_NAMES,
  ProseIDError,
  ProseIDForm,
  THEME_NAMES,
  VERSION,
  mount,
  mountAll,
  mountTest
};
//# sourceMappingURL=proseid.js.map
