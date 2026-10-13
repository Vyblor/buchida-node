<div align="center">
  <img src="assets/logo-black.svg" alt="buchida" width="280" />
  <p><strong>buchida Node.js SDK — Email API for AI agents</strong></p>

  [**English**](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [中文](README.zh.md)

  [![npm version](https://img.shields.io/npm/v/buchida)](https://www.npmjs.com/package/buchida) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

---

buchida is the official Node.js SDK for **buchida** — an email API built for AI agents. buchida ships a CLI, an MCP server, and SDKs in 5 languages (Node, Python, Go, Ruby, Java), all sharing the same REST API surface. `@buchida/email` templates render Korean, Japanese, and Chinese natively.

## Install

```bash
npm install buchida
```

## Send your first email

```ts
import { Buchida } from 'buchida';

const buchida = new Buchida(process.env.BUCHIDA_API_KEY);

const email = await buchida.emails.send({
  from: 'hello@yourapp.com',
  fromName: 'Vyblor',
  to: 'user@example.com',
  subject: 'Hello',
  html: '<h1>Welcome</h1>',
});

console.log(email.id);
```

## Upgrading to 0.2

- Responses are now unwrapped: `const { id } = await buchida.emails.send(...)`. Previously the
  raw `{ data: ... }` envelope was returned while the types claimed otherwise.
- `res.data` still works (a non-enumerable, deprecated alias to the same value, also on arrays
  such as `domains.list()`), so existing `res.data.id` code keeps running. Prefer reading fields directly.
- `emails.list()` still returns `{ data, cursor, hasMore }`. `emails.sendBatch()` returns per-item
  `{ data?, error? }` results. `emails.cancel()` now returns the cancelled email.
- `fromName` / `replyTo` / `scheduledAt` are now actually sent to the API (as `from_name`, `reply_to`, `scheduled_at`).
- Response fields are snake_case, exactly as the API returns them (`created_at`, `from_name`,
  `dns_records`...). The old camelCase type fields (`createdAt`, `records`) were never populated
  at runtime and have been removed from the types. `Metrics` now matches the real response
  (`total`, `by_status`, `delivery_rate`, ...).

- **Errors:** `err.code` on `AuthenticationError`, `RateLimitError`, `NotFoundError` and
  `ValidationError` keeps its 0.1.x fixed value (`"authentication_error"`, `"rate_limit_error"`,
  `"not_found"`, `"validation_error"`), so `switch (err.code)` code keeps working. The API's own
  code (`"invalid_api_key"`, `"daily_quota_exceeded"`, ...) is available on every error as the new
  `err.apiCode`. On a plain `BuchidaError`, `code` is the API code (as in 0.1.x) and `apiCode` equals it.
- **`res.data` is non-enumerable.** The legacy alias does not survive `JSON.stringify`,
  `structuredClone`, object spread or Next.js server-action serialization; the serialized/cloned
  value is the unwrapped payload itself, so read fields directly (`res.id`) instead of `res.data.id`.
- List methods (e.g. `domains.list()`) now return real arrays (`Array.isArray(res)` is `true`).
- TypeScript types changed (0.x minor): camelCase fields that were never populated at runtime were
  removed, `SendEmailResponse` is now `Email`, the `sendBatch` result type is per-item
  `{ data?, error? }`, and `MetricsDataPoint` was removed. Recompile and fix any type errors.

## Errors

```ts
try {
  await buchida.emails.send(...);
} catch (err) {
  if (err instanceof BuchidaError) console.log(err.statusCode, err.code, err.apiCode);
}
```

## Documentation

Full docs: **[buchida.com/docs](https://buchida.com/docs)**

- API reference: https://buchida.com/docs/api-reference
- Quickstart guide: https://buchida.com/docs/quickstart
- CJK email templates: https://buchida.com/docs/templates
- MCP server setup: https://buchida.com/docs/mcp
- CLI reference: https://buchida.com/docs/cli

## Links

- **Website:** [buchida.com](https://buchida.com)
- **Documentation:** [buchida.com/docs](https://buchida.com/docs)
- **Pricing:** [buchida.com/pricing](https://buchida.com/pricing)
- **GitHub:** https://github.com/Vyblor/buchida-node

## License

MIT
