# buchida

Official Node.js SDK for the [buchida](https://buchida.com) email API.

## Installation

```bash
npm install buchida
```

## Quick Start

```typescript
import { Buchida } from "buchida";

const buchida = new Buchida("bc_live_xxxxxxxxxxxxxxxxxxxxx");

// Send an email
const { id } = await buchida.emails.send({
  from: "hello@yourdomain.com",
  to: "user@example.com",
  subject: "Welcome to buchida!",
  html: "<h1>Hello!</h1><p>Welcome aboard.</p>",
});

console.log(`Email sent: ${id}`);
```

## Features

- Full TypeScript types
- ESM + CJS dual export
- Zero dependencies (native `fetch`)
- Node.js 18+

## API Reference

### Emails

```typescript
// Send
await buchida.emails.send({ from, to, subject, html, text, replyTo, cc, bcc, tags, scheduledAt });

// Send batch
await buchida.emails.sendBatch([{ from, to, subject, html }, ...]);

// Get
await buchida.emails.get("email_id");

// List
await buchida.emails.list({ cursor, limit, status, from, to });

// Cancel scheduled email
await buchida.emails.cancel("email_id");
```

### Domains

```typescript
await buchida.domains.create({ name: "yourdomain.com" });
await buchida.domains.list();
await buchida.domains.get("domain_id");
await buchida.domains.verify("domain_id");
```

### API Keys

```typescript
await buchida.apiKeys.create({ name: "Production", permission: "full_access" });
await buchida.apiKeys.list();
await buchida.apiKeys.delete("key_id");
```

### Webhooks

```typescript
await buchida.webhooks.create({ url: "https://example.com/webhook", events: ["email.delivered"] });
await buchida.webhooks.list();
await buchida.webhooks.delete("webhook_id");
```

### Templates

```typescript
await buchida.templates.list();
await buchida.templates.get("template_id");
```

### Metrics

```typescript
await buchida.metrics.get({ from: "2026-03-01", to: "2026-03-31", granularity: "day" });
```

## Configuration

```typescript
const buchida = new Buchida("bc_live_xxx", {
  baseUrl: "https://custom-api.example.com",  // Default: https://api.buchida.com
  timeout: 60000,                               // Default: 30000ms
});
```

## Error Handling

```typescript
import { Buchida, AuthenticationError, RateLimitError, BuchidaError } from "buchida";

try {
  await buchida.emails.send({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // 401 — invalid API key
  } else if (error instanceof RateLimitError) {
    // 429 — too many requests
  } else if (error instanceof BuchidaError) {
    // Other API errors (404, 422, 500, etc.)
    console.error(error.statusCode, error.message);
  }
}
```

## License

MIT
