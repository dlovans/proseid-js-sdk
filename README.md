# ProseID JavaScript SDK

Embed a published ProseID Flow inside a customer website without shipping the ProseID validation engine. The SDK renders a responsive Flow directly inside an isolated Shadow DOM, sends respondent changes to ProseID for remote validation, and enables final completion only when the pinned schema is ready.

The renderer follows the Flow selected by its publisher: a Standard Form, one-question-at-a-time Guided Assessment, Determination, or auditable Compliance Checklist. Required controls carry a visible text label as well as native accessibility semantics in every experience, and dates use the ProseID calendar instead of the browser's inconsistent native picker.

Final submission is not a client-side “success” flag. ProseID authoritatively re-runs the schema, debits the Flow owner once, encrypts the responses, creates the normal encrypted record and signed proof, then performs the Flow's email/webhook delivery. Calculated outcomes are revealed from that completion response, never from a provisional browser-side preview.

For time-aware schemas, the manifest also supplies the server's current UTC `effectiveAt` date and
the legal period selected for it. The SDK sends that date on every validation and completion call;
the completed record and proof retain the date, rule-set name, and inclusive range. If a Flow stays
open across UTC midnight, the server returns `flow_changed` and the respondent must reload before
continuing, so an old page cannot complete against stale legal logic.

## Why use the ProseID SDK?

- It renders directly in the host page, so sticky panels, completion focus, responsive sizing, and accessibility follow the surrounding page naturally.
- Shadow DOM isolates the Flow from ordinary host-page CSS collisions while the server remains authoritative for validation, pricing, attribution mode, and record creation.
- The host receives lifecycle events without receiving the validation engine or any secret credential.
- The completed record is identical to one created by a hosted Flow.
- After completion, the respondent can request the same co-branded email and PDF receipt as the hosted flow.
- A provider-neutral signing adapter is already part of the composition boundary for future UIP signing.

## Install on a website

First, open the Flow in the ProseID workspace, choose its theme and embedded-attribution mode, then add the website under **Embedded Flow websites**. Origins are exact: use `https://www.example.com`, not a path. HTTPS is required except for localhost development.

Create a **Publishable / SDK** key in **Workspace → API keys**. Publishable keys begin with
`proseid_pk_` and are safe to include in browser code. They identify the organization whose Flow,
schema, balance, audit records, and co-branding apply. Never put a secret `proseid_sk_` key in a
website—the embed API rejects secret keys.

```html
<div id="compliance-form"></div>
<script src="https://cdn.jsdelivr.net/npm/@alentra/proseid-js-sdk@0.10.8/dist/proseid.min.js"></script>
<script>
  const form = ProseID.mount('#compliance-form', {
	apiKey: 'proseid_pk_YOUR_PUBLISHABLE_KEY',
    flow: 'flow_01ABCDEF23456789',
    onComplete(result) {
      console.log('ProseID audit record', result.recordId);
    }
  });
</script>
```

For an ES module build:

```bash
npm install @alentra/proseid-js-sdk
```

```js
import { mount } from '@alentra/proseid-js-sdk';

const form = mount('#compliance-form', {
	apiKey: 'proseid_pk_YOUR_PUBLISHABLE_KEY',
  flow: 'flow_01ABCDEF23456789',
	locale: 'en', // Optional. Otherwise the saved browser choice or schema recommendation is used.
  appearance: { shape: 'capsule', fields: 'outlined', shell: 'card' },
  branding: { logoUrl: 'https://example.com/logo.svg', logoAlt: 'Example' }
});

await form.ready;
```

Use the canonical Flow ID shown in the ProseID workspace. Human-readable publisher and Flow slugs
are presentation addresses and are not accepted by the SDK, so renaming either cannot break an
embedded integration.

After a successful completion, the SDK brings the receipt and optional email controls into view.
Set `autoFocusCompletion: false` only when the host application provides its own equivalent focus
or scroll behavior.

The answer-progress rail remains visible while the respondent moves through a long Flow. It sticks
to the top of the viewport by default. If the host website has its own fixed header, set an inherited
CSS offset on the mount target, for example `#compliance-form { --proseid-sticky-offset: 72px; }`.
Avoid placing the mount target inside an ancestor with `overflow: hidden` or `overflow: auto`, because
that ancestor becomes the browser's sticky-position boundary.

English and Swedish are bundled. The schema's language is the initial recommendation, while the
respondent can switch language inside an active Flow. Their choice is saved in browser storage and
sent with the completed record. Schema-authored labels, help text and choices are not translated by
the SDK; publish those in the language intended for respondents.

## Appearance and branding

Customization is intentionally bounded so validation states, keyboard focus, mobile layout, field
semantics, and ProseID attribution retain a dependable visual floor. Use one geometry preset
(`soft`, `capsule`, `rigid`, or `underline`) or compose the same controls:

```js
mount('#compliance-form', {
  apiKey: 'proseid_pk_YOUR_PUBLISHABLE_KEY',
  flow: 'flow_01ABCDEF23456789',
  appearance: {
    shape: 'rigid',       // soft | capsule | rigid
    fields: 'underline',  // outlined | underline
    shell: 'flat',        // card | flat
    density: 'compact'    // comfortable | compact
  },
  colors: {
    accent: '#e23d19',
    canvas: '#f7f5f1',
    surface: '#ffffff',
    ink: '#171918'
  },
  branding: {
    logoUrl: 'https://example.com/brand.svg',
    logoAlt: 'Example'
  }
});
```

`logoUrl` accepts HTTPS images (plus HTTP on localhost) and falls back to the organization logo in
ProseID. Raw HTML, raw SVG markup, and arbitrary CSS are not accepted.

Themes are selected on the Flow in ProseID so the hosted and embedded renderers begin from the same
palette. `light` is the default. `charcoal` is neutral and architectural; `midnight` uses a restrained
ink-blue field; `forest` uses a deep institutional green. The `theme` mount option remains a loading
and `mountTest` preview fallback; a production manifest supplies the Flow's saved theme.

Use `colors` to override the complete renderer palette. Supported tokens are `accent`, `accentInk`,
`canvas`, `surface`, `ink`, `copy`, `muted`, `rule`, `success`, `successTint`, `submitInk`, and
`skeletonGlow`. Every value must exactly match `#RRGGBB`. Three-digit hex, alpha hex, CSS functions,
variables, declarations, and unknown tokens are ignored. Accepted values are assigned only through
`style.setProperty`; they are never inserted as CSS source text. `COLOR_TOKEN_NAMES` and `THEME_NAMES`
expose the accepted names for configuration UIs. ProseID attribution uses a fixed readable badge so
a poor customer palette does not make the trust mark disappear.

`full` and `compact` attribution have the standard completion price. `hidden` is the supported
white-label mode. The publisher selects it on the Flow; the authenticated server returns that
authoritative mode and frozen price in `manifest.presentation`, and a completed production record is
billed 25% extra on its base price. Prices use integer microns internally (1,000 microns = US$1) to
avoid floating-point money; use `completionMicrons / 1000` when displaying USD. The record captures
the embed source, publishable key,
origin, SDK version, attribution mode, and pricing components. Test completions are always free.
The legacy `branding.proseid` mount preference cannot override a production Flow or its billing.

The renderer runs locally, but the Flow's allowed website origins, validation, attribution mode,
price, completion debit, encryption, proof, and delivery are enforced by ProseID's server. Changing
the browser markup or request headers cannot change the server-owned price or create a valid record
without passing the published schema. ProseID does not expose an arbitrary secret-key endpoint for
submitting completed answers: use the hosted Flow or this SDK.

## Respondent receipt

After a production completion, the SDK asks whether the respondent wants a copy. They enter and
confirm their own email address; the SDK does not infer a recipient from schema fields. ProseID then
rebuilds the receipt from the encrypted server record and emails the same co-branded PDF available
in the hosted flow. Receipt delivery is not billed and a delivery failure never changes the already
completed record.

The receipt request is checked against the publishable key, exact allowed origin, organisation,
Flow and completed embed record. It is rate-limited separately. Built-in test completions show that
email is unavailable because no record is stored and no real message is sent.

## Built-in integration test

Use `mountTest` before publishing a schema. It loads ProseID's server-hosted field gallery with text,
number, yes/no, select, date, currency, confirmation, field information, placeholders, metadata, and
conditional UI messages. Validation reaches the real ProseID engine, but completion is simulated:
nothing is stored, delivered, or billed.

```js
import { mountTest } from '@alentra/proseid-js-sdk';

const test = mountTest('#compliance-form', {
  apiKey: 'proseid_pk_YOUR_PUBLISHABLE_KEY',
  appearance: 'underline',
  branding: { proseid: 'compact' }
});

await test.ready;
```

## Events

The target element dispatches bubbling custom events:

- `proseid:ready`
- `proseid:change`
- `proseid:validation`
- `proseid:submit`
- `proseid:complete`
- `proseid:receipt`
- `proseid:language`
- `proseid:error`
- `proseid:signing` (reserved for a future signing action)

Matching callbacks can be passed as `onReady`, `onChange`, `onValidation`, `onSubmit`, `onComplete`, `onReceipt`, `onLanguage`, and `onError`.

## Content Security Policy

Allow the ProseID API in `connect-src`. If the browser bundle is loaded from jsDelivr, allow that
exact CDN in `script-src` too. Styles are installed inside the component's Shadow DOM; hosts with a
strict `style-src` policy can pass their CSP nonce as the `nonce` mount option.

```text
connect-src 'self' https://proseid.com;
script-src 'self' https://cdn.jsdelivr.net;
```

## Local development

```bash
npm install
npm test
npm run build
```

Serve `examples/basic` over HTTP and add its exact localhost origin to the selected ProseID Flow.
Change `YOUR_PROSEID_PUBLISHABLE_KEY` and `YOUR_FLOW_ID` in the example before loading it.
`examples/test` needs only a publishable key because the built-in field gallery does not require a published
schema or a Flow origin allow-list.

## Flow and signing support

The JavaScript SDK embeds all four current Flow experiences:

- **Standard Form** shows the visible questions in one responsive document.
- **Guided Assessment** validates each current question before moving to a final answer review.
- **Determination** checks answers as they change, then reveals the authoritative calculated outcome after successful submission.
- **Compliance Checklist** separates context from explicit controls and requires every yes/no or confirmation control to be reviewed.

Unsigned and basic-signature Flows are supported. For a basic signature, the SDK collects
the respondent's typed legal name and explicit acknowledgement immediately before completion, then
sends that evidence through the normal encrypted record pipeline. The provider-neutral
`signingAdapter` boundary remains available for a future UIP signing action without coupling the
renderer to UIP.

## Licence

Apache-2.0. You may use, modify, and redistribute the SDK, including in commercial products, subject to the licence's notice requirements. The licence does not grant rights to ProseID names or trademarks. Using the SDK does not grant access to the ProseID service without a valid publishable key and an allowed website origin.
