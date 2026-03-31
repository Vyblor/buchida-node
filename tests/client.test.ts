import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AuthenticationError,
	Buchida,
	BuchidaError,
	RateLimitError,
} from "../src/index.js";

function mockFetch(status: number, body: unknown) {
	return vi.fn().mockResolvedValue({
		ok: status >= 200 && status < 300,
		status,
		statusText: status === 200 ? "OK" : "Error",
		json: () => Promise.resolve(body),
	});
}

describe("Buchida Node SDK", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		vi.useRealTimers();
	});

	it("throws if no API key provided", () => {
		expect(() => new Buchida("")).toThrow("API key is required");
	});

	// ── Emails ────────────────────────────────────────────────────────────

	describe("emails", () => {
		it("send() posts to /emails", async () => {
			const fetcher = mockFetch(200, { id: "email_123" });
			globalThis.fetch = fetcher;

			const client = new Buchida("bc_test_xxx");
			const result = await client.emails.send({
				from: "hi@buchida.com",
				to: "user@example.com",
				subject: "Hello",
				html: "<p>Hello</p>",
			});

			expect(result).toEqual({ id: "email_123" });
			expect(fetcher).toHaveBeenCalledWith(
				"https://api.buchida.com/emails",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: "Bearer bc_test_xxx",
					}),
				}),
			);
		});

		it("get() fetches a single email", async () => {
			const email = {
				id: "email_123",
				from: "hi@buchida.com",
				to: ["user@example.com"],
				subject: "Hello",
				status: "delivered",
				createdAt: "2026-03-31T00:00:00Z",
			};
			globalThis.fetch = mockFetch(200, email);

			const client = new Buchida("bc_test_xxx");
			const result = await client.emails.get("email_123");
			expect(result.id).toBe("email_123");
			expect(result.status).toBe("delivered");
		});

		it("list() with query params", async () => {
			globalThis.fetch = mockFetch(200, { data: [], cursor: null });

			const client = new Buchida("bc_test_xxx");
			await client.emails.list({ limit: 10, status: "delivered" });

			expect(globalThis.fetch).toHaveBeenCalledWith(
				expect.stringContaining("limit=10"),
				expect.anything(),
			);
		});

		it("cancel() posts to /emails/:id/cancel", async () => {
			globalThis.fetch = mockFetch(204, undefined);

			const client = new Buchida("bc_test_xxx");
			await client.emails.cancel("email_123");

			expect(globalThis.fetch).toHaveBeenCalledWith(
				"https://api.buchida.com/emails/email_123/cancel",
				expect.objectContaining({ method: "POST" }),
			);
		});

		it("sendBatch() posts array to /emails/batch", async () => {
			globalThis.fetch = mockFetch(200, [
				{ id: "email_1" },
				{ id: "email_2" },
			]);

			const client = new Buchida("bc_test_xxx");
			const result = await client.emails.sendBatch([
				{
					from: "hi@buchida.com",
					to: "a@example.com",
					subject: "A",
					text: "a",
				},
				{
					from: "hi@buchida.com",
					to: "b@example.com",
					subject: "B",
					text: "b",
				},
			]);
			expect(result).toHaveLength(2);
		});
	});

	// ── Domains ───────────────────────────────────────────────────────────

	describe("domains", () => {
		it("create() posts to /domains", async () => {
			globalThis.fetch = mockFetch(200, {
				id: "dom_1",
				name: "example.com",
				status: "pending",
				records: [],
				createdAt: "2026-03-31T00:00:00Z",
			});

			const client = new Buchida("bc_test_xxx");
			const result = await client.domains.create({ name: "example.com" });
			expect(result.name).toBe("example.com");
		});

		it("list() fetches all domains", async () => {
			globalThis.fetch = mockFetch(200, []);
			const client = new Buchida("bc_test_xxx");
			const result = await client.domains.list();
			expect(Array.isArray(result)).toBe(true);
		});

		it("verify() posts to /domains/:id/verify", async () => {
			globalThis.fetch = mockFetch(200, {
				id: "dom_1",
				name: "example.com",
				status: "verified",
				records: [],
				createdAt: "2026-03-31T00:00:00Z",
			});

			const client = new Buchida("bc_test_xxx");
			const result = await client.domains.verify("dom_1");
			expect(result.status).toBe("verified");
		});
	});

	// ── API Keys ──────────────────────────────────────────────────────────

	describe("apiKeys", () => {
		it("create() posts to /api-keys", async () => {
			globalThis.fetch = mockFetch(200, {
				id: "key_1",
				name: "test key",
				key: "bc_live_newkey",
				permission: "full_access",
				createdAt: "2026-03-31T00:00:00Z",
			});

			const client = new Buchida("bc_test_xxx");
			const result = await client.apiKeys.create({
				name: "test key",
				permission: "full_access",
			});
			expect(result.key).toBe("bc_live_newkey");
		});

		it("delete() sends DELETE to /api-keys/:id", async () => {
			globalThis.fetch = mockFetch(204, undefined);
			const client = new Buchida("bc_test_xxx");
			await client.apiKeys.delete("key_1");

			expect(globalThis.fetch).toHaveBeenCalledWith(
				"https://api.buchida.com/api-keys/key_1",
				expect.objectContaining({ method: "DELETE" }),
			);
		});
	});

	// ── Webhooks ──────────────────────────────────────────────────────────

	describe("webhooks", () => {
		it("create() posts to /webhooks", async () => {
			globalThis.fetch = mockFetch(200, {
				id: "wh_1",
				url: "https://example.com/webhook",
				events: ["email.delivered"],
				createdAt: "2026-03-31T00:00:00Z",
			});

			const client = new Buchida("bc_test_xxx");
			const result = await client.webhooks.create({
				url: "https://example.com/webhook",
				events: ["email.delivered"],
			});
			expect(result.id).toBe("wh_1");
		});
	});

	// ── Templates ─────────────────────────────────────────────────────────

	describe("templates", () => {
		it("list() fetches all templates", async () => {
			globalThis.fetch = mockFetch(200, []);
			const client = new Buchida("bc_test_xxx");
			const result = await client.templates.list();
			expect(Array.isArray(result)).toBe(true);
		});

		it("get() fetches a single template", async () => {
			globalThis.fetch = mockFetch(200, {
				id: "tpl_1",
				name: "Welcome",
				createdAt: "2026-03-31T00:00:00Z",
			});

			const client = new Buchida("bc_test_xxx");
			const result = await client.templates.get("tpl_1");
			expect(result.name).toBe("Welcome");
		});
	});

	// ── Metrics ───────────────────────────────────────────────────────────

	describe("metrics", () => {
		it("get() fetches metrics with query params", async () => {
			globalThis.fetch = mockFetch(200, {
				sent: 100,
				delivered: 95,
				opened: 50,
				clicked: 10,
				bounced: 3,
				complained: 1,
				timeseries: [],
			});

			const client = new Buchida("bc_test_xxx");
			const result = await client.metrics.get({
				from: "2026-03-01",
				to: "2026-03-31",
				granularity: "day",
			});
			expect(result.sent).toBe(100);
		});
	});

	// ── Error Handling ────────────────────────────────────────────────────

	describe("error handling", () => {
		it("throws AuthenticationError on 401", async () => {
			globalThis.fetch = mockFetch(401, { message: "Invalid API key" });
			const client = new Buchida("bc_test_bad");

			await expect(client.emails.list()).rejects.toThrow(AuthenticationError);
		});

		it("throws RateLimitError on 429", async () => {
			globalThis.fetch = mockFetch(429, {
				message: "Rate limit exceeded",
			});
			const client = new Buchida("bc_test_xxx");

			await expect(client.emails.list()).rejects.toThrow(RateLimitError);
		});

		it("throws BuchidaError on 500", async () => {
			globalThis.fetch = mockFetch(500, {
				message: "Internal server error",
			});
			const client = new Buchida("bc_test_xxx");

			await expect(client.emails.list()).rejects.toThrow(BuchidaError);
		});
	});

	// ── Options ───────────────────────────────────────────────────────────

	describe("options", () => {
		it("uses custom base URL", async () => {
			globalThis.fetch = mockFetch(200, []);
			const client = new Buchida("bc_test_xxx", {
				baseUrl: "https://custom.api.com",
			});
			await client.domains.list();

			expect(globalThis.fetch).toHaveBeenCalledWith(
				"https://custom.api.com/domains",
				expect.anything(),
			);
		});
	});
});
