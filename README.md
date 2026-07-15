# ProseID JavaScript SDK

Embed a published ProseID Standard Form Flow inside a customer website without shipping the ProseID validation engine or trusting the host page. The SDK renders the fields in an isolated Shadow DOM, sends respondent changes to ProseID for remote validation, and enables submission only when the pinned schema is ready.

Final submission is not a client-side “success” flag. ProseID authoritatively re-runs the schema, debits the publisher once, encrypts the responses, creates the normal encrypted record and signed proof, then performs the form’s email/webhook delivery.

## Why use the SDK instead of an iframe?

- The form feels native to the customer’s product and resizes with its content.
- Customer CSS cannot break field layout, validation states, or ProseID branding.
- The host receives lifecycle events without receiving the validation engine.
- The completed record is identical to one created by a hosted Flow.
- After completion, the respondent can request the same co-branded email and PDF receipt as the hosted flow.
- A provider-neutral signing adapter is already part of the composition boundary for future UIP signing.

## Install on a website

First, open the Flow in the ProseID workspace and add the website under **Embedded Flow websites**. Origins are exact: use `https://www.example.com`, not a path. HTTPS is required except for localhost development.

Create a **Publishable / SDK** key in **Workspace → API keys**. Publishable keys begin with
`proseid_pk_` and are safe to include in browser code. They identify the organization whose Flow,
schema, balance, audit records, and co-branding apply. Never put a secret `proseid_sk_` key in a
website—the embed API rejects secret keys.

```html
<div id="compliance-form"></div>
<script src="https://cdn.jsdelivr.net/npm/@proseid/js-sdk@0.5.0/dist/proseid.min.js"></script>
<script>
  const form = ProseID.mount('#compliance-form', {
	apiKey: 'proseid_pk_YOUR_PUBLISHABLE_KEY',
    flow: 'publisher-handle/flow-slug',
    onComplete(result) {
      console.log('ProseID audit record', result.recordId);
    }
  });
</script>
```

For an ES module build:

```bash
npm install @proseid/js-sdk
```

```js
import { mount } from '@proseid/js-sdk';

const form = mount('#compliance-form', {
	apiKey: 'proseid_pk_YOUR_PUBLISHABLE_KEY',
  flow: 'publisher-handle/flow-slug',
	locale: 'en', // `sv` is also bundled; UI messages can be overridden
  appearance: { shape: 'capsule', fields: 'outlined', shell: 'card' },
  theme: 'charcoal',
  branding: { logoUrl: 'https://example.com/logo.svg', logoAlt: 'Example', proseid: 'compact' }
});

await form.ready;
```

## Appearance and branding

Customization is intentionally bounded so validation states, keyboard focus, mobile layout, field
semantics, and ProseID attribution retain a dependable visual floor. Use one geometry preset
(`soft`, `capsule`, `rigid`, or `underline`) or compose the same controls:

```js
mount('#compliance-form', {
  apiKey: 'proseid_pk_YOUR_PUBLISHABLE_KEY',
  flow: 'publisher-handle/flow-slug',
  appearance: {
    shape: 'rigid',       // soft | capsule | rigid
    fields: 'underline',  // outlined | underline
    shell: 'flat',        // card | flat
    density: 'compact'    // comfortable | compact
  },
  theme: 'midnight', // light | charcoal | midnight | forest
  branding: {
    logoUrl: 'https://example.com/brand.svg',
    logoAlt: 'Example',
    proseid: 'full' // full | compact | hidden
  }
});
```

`logoUrl` accepts HTTPS images (plus HTTP on localhost) and falls back to the organization logo in
ProseID. Raw HTML, raw SVG markup, arbitrary CSS, and custom color values are not accepted.

Themes are curated and WCAG AA contrast-tested across body copy, muted/status copy, errors, success
states, and button labels. `light` is the default. `charcoal` is neutral and architectural;
`midnight` uses a restrained ink-blue field; `forest` uses a deep institutional green. All four keep
vermillion as the ProseID signal. Unknown values—including objects containing color strings—fall
back to `light` without being applied. `THEME_NAMES` exposes the supported names for configuration UIs.

`full` and `compact` attribution have the standard completion price. `hidden` is the supported
white-label mode: the SDK tells the authenticated embed endpoint, the server returns the effective
mode and price in `manifest.presentation`, and a completed production record is billed 25% extra
(currently 250 microns instead of 200). The record captures the embed source, publishable key,
origin, SDK version, attribution mode, and pricing components. Test completions are always free.

The customer controls their browser and can technically modify any open-source browser bundle or
cover any DOM element. ProseID therefore meters the supported `hidden` mode server-side; it does not
claim that browser attribution is cryptographically enforceable. Building a separate UI against the
server API remains a distinct, supported integration path.

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
number, yes/no, select, date, currency, confirmation, and conditional fields. Validation reaches the
real ProseID engine, but completion is simulated: nothing is stored, delivered, or billed.

```js
import { mountTest } from '@proseid/js-sdk';

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
- `proseid:error`
- `proseid:signing` (reserved for a future signing action)

Matching callbacks can be passed as `onReady`, `onChange`, `onValidation`, `onSubmit`, `onComplete`, `onReceipt`, and `onError`.

## Content Security Policy

Allow the ProseID origin in `connect-src` and `img-src`. Modern browsers receive styles through a constructable stylesheet. For the fallback `<style>` path, pass the page’s CSP nonce as `nonce`.

```text
connect-src 'self' https://proseid.com;
img-src 'self' https://proseid.com https://your-publisher-logo-host.example;
```

## Local development

```bash
npm install
npm test
npm run build
```

Serve `examples/basic` over HTTP and add its exact localhost origin to the selected ProseID Flow.
Change `YOUR_PROSEID_PUBLISHABLE_KEY` and `YOUR_PUBLISHER/YOUR_FLOW` in the example before loading it.
`examples/test` needs only a publishable key because the built-in field gallery does not require a published
schema or a form origin allow-list.

## Signing boundary

The current API returns `nextAction: null`. A future signed Flow can return a provider action without changing the renderer’s validation or audit flow. Pass an adapter with `sign(nextAction, context)` when UIP is live; the SDK will delegate the provider interaction rather than embedding provider-specific logic into the Standard Form renderer.

## Licence

Apache-2.0. You may use, modify, and redistribute the SDK, including in commercial products, subject to the licence's notice requirements. The licence does not grant rights to ProseID names or trademarks. Using the SDK does not grant access to the ProseID service without a valid publishable key and an allowed website origin.
