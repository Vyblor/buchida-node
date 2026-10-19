import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AuthenticationError,
	Buchida,
	BuchidaError,
	NotFoundError,
	RateLimitError,
	ValidationError,
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
			const fetcher = mockFetch(201, { data: { id: "email_123" } });
			globalThis.fetch = fetcher;

			const client = new Buchida("bc_test_xxx");
			const result = await client.emails.send({
				from: "hi@buchida.com",
				to: "user@example.com",
				subject: "Hello",
				html: "<p>Hello</p>",
			});

			expect(result).toEqual({ id: "email_123" });
			expect(result.id).toBe("email_123");
			expect(fetcher).toHaveBeenCalledWith(
				"https://api.buchida.com/v1/emails",
				expect.objectContaining({
					method: "POST",
					headers: expect.objectContaining({
						Authorization: "Bearer bc_test_xxx",
					}),
				}),
			);
		});

		it("send() maps camelCase params to snake_case wire body", async () => {
			const fetcher = mockFetch(200, { data: { id: "email_123" } });
			globalThis.fetch = fetcher;
			const client = new Buchida("bc_test_xxx");
			await client.emails.send({
				from: "hi@buchida.com",
				fromName: "Vyblor",
				to: "user@example.com",
				subject: "Hello",
				replyTo: "r@buchida.com",
				scheduledAt: "2026-12-01T00:00:00Z",
			});
			const body = JSON.parse(fetcher.mock.calls[0][1].body);
			expect(body).toEqual({
				from: "hi@buchida.com",
				from_name: "Vyblor",
				to: "user@example.com",
				subject: "Hello",
				reply_to: "r@buchida.com",
				scheduled_at: "2026-12-01T00:00:00Z",
			});
			expect(body).not.toHaveProperty("fromName");
			expect(body).not.toHaveProperty("replyTo");
			expect(body).not.toHaveProperty("scheduledAt");
		});

		it("get() fetches a single email", async () => {
			const email = {
				id: "email_123",
				from: "hi@buchida.com",
				to: ["user@example.com"],
				subject: "Hello",
				status: "delivered",
				created_at: "2026-03-31T00:00:00Z",
				events: [],
			};
			globalThis.fetch = mockFetch(200, { data: email });

			const client = new Buchida("bc_test_xxx");
			const result = await client.emails.get("email_123");
			expect(result.id).toBe("email_123");
			expect(result.status).toBe("delivered");
			expect(result.created_at).toBe("2026-03-31T00:00:00Z");
		});

		it("list() with query params", async () => {
			globalThis.fetch = mockFetch(200, { data: [], hasMore: false });

			const client = new Buchida("bc_test_xxx");
			await client.emails.list({ limit: 10, status: "delivered" });

			expect(globalThis.fetch).toHaveBeenCalledWith(
				expect.stringContaining("limit=10"),
				expect.anything(),
			);
		});

		it("list() passes from/to through unchanged and maps fromDate/toDate/direction", async () => {
			globalThis.fetch = mockFetch(200, { data: [], hasMore: false });
			const client = new Buchida("bc_test_xxx");
			await client.emails.list({
				from: "a+b@x.com",
				to: "c@y.com",
				fromDate: "2026-01-01",
				toDate: "2026-02-01",
				direction: "inbound",
			});
			const url = new URL((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]);
			expect(url.searchParams.get("from")).toBe("a+b@x.com");
			expect(url.searchParams.get("to")).toBe("c@y.com");
			expect(url.searchParams.get("from_date")).toBe("2026-01-01");
			expect(url.searchParams.get("to_date")).toBe("2026-02-01");
			expect(url.searchParams.get("direction")).toBe("inbound");
		});

		it("list() with no params sends no query string", async () => {
			globalThis.fetch = mockFetch(200, { data: [], hasMore: false });
			await new Buchida("bc_test_xxx").emails.list();
			const url = new URL((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]);
			expect(url.search).toBe("");
		});

		it("cancel() posts to /emails/:id/cancel", async () => {
			globalThis.fetch = mockFetch(200, { data: { id: "email_123", status: "cancelled" } });

			const client = new Buchida("bc_test_xxx");
			const cancelled = await client.emails.cancel("email_123");
			expect(cancelled.status).toBe("cancelled");

			expect(globalThis.fetch).toHaveBeenCalledWith(
				"https://api.buchida.com/v1/emails/email_123/cancel",
				expect.objectContaining({ method: "POST" }),
			);
		});

		it("sendBatch() posts array to /emails/batch", async () => {
			globalThis.fetch = mockFetch(201, {
				data: [
					{ data: { id: "email_1" } },
					{ error: { code: "validation_error", message: "bad" } },
				],
			});

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
			expect(result[0].data?.id).toBe("email_1");
			expect(result[1].error?.code).toBe("validation_error");
			expect(result.data).toBe(result);
		});

		it("sendBatch() maps each item to snake_case", async () => {
			const fetcher = mockFetch(200, { data: [] });
			globalThis.fetch = fetcher;
			const client = new Buchida("bc_test_xxx");
			await client.emails.sendBatch([
				{ from: "a@b.com", fromName: "A", to: "x@y.com", subject: "1", replyTo: "r@b.com" },
				{ from: "a@b.com", to: "z@y.com", subject: "2", scheduledAt: "2026-12-01T00:00:00Z" },
			]);
			const body = JSON.parse(fetcher.mock.calls[0][1].body);
			expect(body).toEqual([
				{ from: "a@b.com", from_name: "A", to: "x@y.com", subject: "1", reply_to: "r@b.com" },
				{ from: "a@b.com", to: "z@y.com", subject: "2", scheduled_at: "2026-12-01T00:00:00Z" },
			]);
		});
	});

	// ── Domains ───────────────────────────────────────────────────────────

	describe("domains", () => {
		it("create() posts to /domains", async () => {
			globalThis.fetch = mockFetch(201, {
				data: {
					id: "dom_1",
					name: "example.com",
					status: "pending",
					dns_records: [],
					created_at: "2026-03-31T00:00:00Z",
				},
			});

			const client = new Buchida("bc_test_xxx");
			const result = await client.domains.create({ name: "example.com" });
			expect(result.name).toBe("example.com");
		});

		it("list() fetches all domains", async () => {
			globalThis.fetch = mockFetch(200, { data: [{ id: "dom_1" }] });
			const client = new Buchida("bc_test_xxx");
			const result = await client.domains.list();
			expect(Array.isArray(result)).toBe(true);
			expect(result[0].id).toBe("dom_1");
		});

		it("verify() posts to /domains/:id/verify", async () => {
			globalThis.fetch = mockFetch(200, {
				data: { id: "dom_1", name: "example.com", status: "verified", dns_records: [] },
			});

			const client = new Buchida("bc_test_xxx");
			const result = await client.domains.verify("dom_1");
			expect(result.status).toBe("verified");
		});
	});

	// ── API Keys ──────────────────────────────────────────────────────────

	describe("apiKeys", () => {
		it("create() posts to /api-keys", async () => {
			globalThis.fetch = mockFetch(201, {
				data: {
					id: "key_1",
					name: "test key",
					key: "bc_live_newkey",
					permission: "full_access",
					created_at: "2026-03-31T00:00:00Z",
				},
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
				"https://api.buchida.com/v1/api-keys/key_1",
				expect.objectContaining({ method: "DELETE" }),
			);
		});
	});

	// ── Webhooks ──────────────────────────────────────────────────────────

	describe("webhooks", () => {
		it("create() posts to /webhooks", async () => {
			globalThis.fetch = mockFetch(201, {
				data: {
					id: "wh_1",
					url: "https://example.com/webhook",
					events: ["email.delivered"],
					created_at: "2026-03-31T00:00:00Z",
				},
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
			globalThis.fetch = mockFetch(200, { data: [{ id: "tpl_1", name: "Welcome" }] });
			const client = new Buchida("bc_test_xxx");
			const result = await client.templates.list();
			expect(Array.isArray(result)).toBe(true);
			expect(result.map((t) => t.id)).toEqual(["tpl_1"]);
			expect(result.data[0].name).toBe("Welcome");
		});

		it("list() with no params sends no query string", async () => {
			globalThis.fetch = mockFetch(200, { data: [] });
			await new Buchida("bc_test_xxx").templates.list();
			const url = new URL((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]);
			expect(url.search).toBe("");
		});

		it("list() sends status/search", async () => {
			globalThis.fetch = mockFetch(200, { data: [] });
			await new Buchida("bc_test_xxx").templates.list({ status: "published", search: "hi" });
			const url = new URL((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]);
			expect(url.searchParams.get("status")).toBe("published");
			expect(url.searchParams.get("search")).toBe("hi");
		});

		it("get() fetches a single template", async () => {
			globalThis.fetch = mockFetch(200, {
				data: { id: "tpl_1", name: "Welcome", created_at: "2026-03-31T00:00:00Z" },
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
				data: {
					total: 100,
					by_status: { delivered: 95 },
					filtered_total: 100,
					filtered_by_status: { delivered: 95 },
					delivery_rate: 0.95,
					bounce_rate: 0.03,
					complaint_rate: 0.01,
				},
			});

			const client = new Buchida("bc_test_xxx");
			const result = await client.metrics.get({
				from: "2026-03-01",
				to: "2026-03-31",
				granularity: "day",
			});
			expect(result.total).toBe(100);
			expect(result.delivery_rate).toBe(0.95);
			const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as string);
			expect(url.searchParams.get("from_date")).toBe("2026-03-01");
			expect(url.searchParams.get("to_date")).toBe("2026-03-31");
			expect(url.searchParams.has("from")).toBe(false);
		});
	});

	// ── Envelope unwrapping ───────────────────────────────────────────────

	describe("response envelope", () => {
		const send = () =>
			new Buchida("bc_test_xxx").emails.send({
				from: "a@b.com",
				to: "x@y.com",
				subject: "s",
			});

		it("unwraps single objects and keeps res.data as a legacy alias", async () => {
			globalThis.fetch = mockFetch(201, { data: { id: "email_1", status: "queued" } });
			const res = await send();
			expect(res.id).toBe("email_1");
			expect(res.data.id).toBe("email_1");
			expect(res.data).toBe(res);
		});

		it("alias is non-enumerable: not in keys, JSON or spread", async () => {
			globalThis.fetch = mockFetch(201, { data: { id: "email_1" } });
			const res = await send();
			expect(Object.keys(res)).toEqual(["id"]);
			expect(JSON.parse(JSON.stringify(res))).toEqual({ id: "email_1" });
			expect({ ...res }).toEqual({ id: "email_1" });
		});

		it("array endpoints return arrays with a self-referencing data alias", async () => {
			globalThis.fetch = mockFetch(200, { data: [{ id: "k1" }, { id: "k2" }] });
			const keys = await new Buchida("bc_test_xxx").apiKeys.list();
			expect(Array.isArray(keys)).toBe(true);
			expect(keys).toHaveLength(2);
			expect(keys.data.map((k) => k.id)).toEqual(["k1", "k2"]);
			expect(Object.keys(keys)).toEqual(["0", "1"]);
			expect(JSON.stringify(keys)).toBe('[{"id":"k1"},{"id":"k2"}]');
		});

		it("webhooks.list() returns an array", async () => {
			globalThis.fetch = mockFetch(200, { data: [{ id: "wh_1" }] });
			const res = await new Buchida("bc_test_xxx").webhooks.list();
			expect(res[0].id).toBe("wh_1");
			expect(res.data[0].id).toBe("wh_1");
		});

		it("emails.list() keeps the envelope", async () => {
			globalThis.fetch = mockFetch(200, { data: [{ id: "e1" }], cursor: "e1", hasMore: true });
			const res = await new Buchida("bc_test_xxx").emails.list();
			expect(res.data[0].id).toBe("e1");
			expect(res.cursor).toBe("e1");
			expect(res.hasMore).toBe(true);
		});

		it("still works when the server returns a bare (non-enveloped) body", async () => {
			globalThis.fetch = mockFetch(200, { id: "email_bare" });
			const res = await send();
			expect(res.id).toBe("email_bare");
			expect(res.data.id).toBe("email_bare");

			globalThis.fetch = mockFetch(200, [{ id: "d1" }]);
			const list = await new Buchida("bc_test_xxx").domains.list();
			expect(list[0].id).toBe("d1");
		});

		it("returns primitives / empty bodies as-is", async () => {
			globalThis.fetch = mockFetch(204, undefined);
			const res = await new Buchida("bc_test_xxx").emails.cancel("e1");
			expect(res).toBeUndefined();
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

		it("unwraps nested 422 error into ValidationError with code", async () => {
			globalThis.fetch = mockFetch(422, {
				error: { code: "validation_error", message: "from_name must not contain < or >" },
			});
			const client = new Buchida("bc_test_xxx");
			const err = await client.emails
				.send({ from: "a@b.com", fromName: "<x>", to: "x@y.com", subject: "s" })
				.catch((e) => e);
			expect(err).toBeInstanceOf(ValidationError);
			expect(err.message).toBe("from_name must not contain < or >");
			expect(err.code).toBe("validation_error");
		});

		it("unwraps nested 403 error into BuchidaError with code", async () => {
			globalThis.fetch = mockFetch(403, {
				error: { code: "domain_not_verified", message: "Domain not verified" },
			});
			const client = new Buchida("bc_test_xxx");
			const err = await client.emails
				.send({ from: "a@b.com", to: "x@y.com", subject: "s" })
				.catch((e) => e);
			expect(err).toBeInstanceOf(BuchidaError);
			expect(err.statusCode).toBe(403);
			expect(err.code).toBe("domain_not_verified");
			expect(err.message).toBe("Domain not verified");
		});

		it("keeps legacy fixed codes on subclasses and exposes apiCode", async () => {
			const cases: Array<[number, string, new (...a: never[]) => Error, string]> = [
				[401, "invalid_api_key", AuthenticationError, "authentication_error"],
				[429, "daily_quota_exceeded", RateLimitError, "rate_limit_error"],
				[404, "email_not_found", NotFoundError, "not_found"],
				[422, "invalid_email_address", ValidationError, "validation_error"],
			];
			for (const [status, apiCode, Cls, legacy] of cases) {
				globalThis.fetch = mockFetch(status, { error: { code: apiCode, message: "m" } });
				const client = new Buchida("bc_test_xxx");
				const err = await client.emails.list().catch((e) => e);
				expect(err).toBeInstanceOf(Cls);
				expect(err.code).toBe(legacy);
				expect(err.apiCode).toBe(apiCode);
			}
		});

		it("sets apiCode equal to code on generic errors", async () => {
			globalThis.fetch = mockFetch(403, { error: { code: "domain_not_verified", message: "x" } });
			const client = new Buchida("bc_test_xxx");
			const err = await client.emails.list().catch((e) => e);
			expect(err.code).toBe("domain_not_verified");
			expect(err.apiCode).toBe("domain_not_verified");
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
