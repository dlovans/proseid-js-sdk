# ProseID JavaScript SDK

Embed a published ProseID form inside a customer website without shipping the ProseID validation engine or trusting the host page. The SDK renders the fields in an isolated Shadow DOM, sends respondent changes to ProseID for remote validation, and enables submission only when the pinned schema is ready.

Final submission is not a client-side “success” flag. ProseID authoritatively re-runs the schema, debits the publisher once, encrypts the responses, creates the normal session and audit proof, then performs the form’s email/webhook delivery.

## Why use the SDK instead of an iframe?

- The form feels native to the customer’s product and resizes with its content.
- Customer CSS cannot break field layout, validation states, or ProseID branding.
- The host receives lifecycle events without receiving the validation engine.
- The completed record is identical to a hosted ProseID session.
- A provider-neutral signing adapter is already part of the composition boundary for future UIP signing.

## Install on a website

First, open the form in the ProseID workspace and add the website under **Embedded form websites**. Origins are exact: use `https://www.example.com`, not a path. HTTPS is required except for localhost development.

Create a **Publishable / SDK** key in **Workspace → API keys**. Publishable keys begin with
`proseid_pk_` and are safe to include in browser code. They identify the organization whose form,
schema, balance, audit records, and co-branding apply. Never put a secret `proseid_sk_` key in a
website—the embed API rejects secret keys.

```html
<div id="compliance-form"></div>
<script src="https://cdn.jsdelivr.net/gh/dlovans/proseid-js-sdk@v0.2.0/dist/proseid.min.js"></script>
<script>
  const form = ProseID.mount('#compliance-form', {
	apiKey: 'proseid_pk_YOUR_PUBLISHABLE_KEY',
    form: 'publisher-handle/form-slug',
    onComplete(result) {
      console.log('ProseID audit record', result.sessionId);
    }
  });
</script>
```

For an ES module build:

```bash
npm install github:dlovans/proseid-js-sdk#v0.2.0
```

```js
import { mount } from '@proseid/js-sdk';

const form = mount('#compliance-form', {
	apiKey: 'proseid_pk_YOUR_PUBLISHABLE_KEY',
  form: 'publisher-handle/form-slug',
	locale: 'en', // `sv` is also bundled; UI messages can be overridden
  theme: { accent: '#ff4d1f', radius: '12px' }
});

await form.ready;
```

## Events

The target element dispatches bubbling custom events:

- `proseid:ready`
- `proseid:change`
- `proseid:validation`
- `proseid:submit`
- `proseid:complete`
- `proseid:error`
- `proseid:signing` (reserved for a future signing action)

Matching callbacks can be passed as `onReady`, `onChange`, `onValidation`, `onSubmit`, `onComplete`, and `onError`.

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

Serve `examples/basic` over HTTP and add its exact localhost origin to the selected ProseID form.
Change `YOUR_PROSEID_PUBLISHABLE_KEY` and `YOUR_PUBLISHER/YOUR_FORM` in the example before loading it.

## Signing boundary

The current API returns `nextAction: null`. A future signed form can return a provider action without changing the renderer’s validation or audit flow. Pass an adapter with `sign(nextAction, context)` when UIP is live; the SDK will delegate the provider interaction rather than embedding provider-specific logic into the form renderer.

## Licence

Apache-2.0. You may use, modify, and redistribute the SDK, including in commercial products, subject to the licence's notice requirements. The licence does not grant rights to ProseID names or trademarks. Using the SDK does not grant access to the ProseID service without a valid publishable key and an allowed website origin.
