import {
	AuthenticationError,
	BuchidaError,
	NotFoundError,
	RateLimitError,
	ValidationError,
} from "./errors.js";
import type {
	ApiErrorBody,
	ApiKey,
	BatchSendResult,
	BuchidaOptions,
	CreateApiKeyParams,
	CreateDomainParams,
	CreateWebhookParams,
	Domain,
	Email,
	GetMetricsParams,
	ListEmailsParams,
	ListEmailsResponse,
	Metrics,
	SendEmailParams,
	SendEmailResponse,
	SendEmailWireBody,
	Template,
	Webhook,
	WithLegacyData,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.buchida.com/v1";
const DEFAULT_TIMEOUT = 30_000;

export class Buchida {
	private readonly apiKey: string;
	private readonly baseUrl: string;
	private readonly timeout: number;

	public readonly emails: Emails;
	public readonly domains: Domains;
	public readonly apiKeys: ApiKeys;
	public readonly webhooks: Webhooks;
	public readonly templates: Templates;
	public readonly metrics: MetricsResource;

	constructor(apiKey: string, options: BuchidaOptions = {}) {
		if (!apiKey) {
			throw new Error("API key is required");
		}
		this.apiKey = apiKey;
		this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
		this.timeout = options.timeout ?? DEFAULT_TIMEOUT;

		this.emails = new Emails(this);
		this.domains = new Domains(this);
		this.apiKeys = new ApiKeys(this);
		this.webhooks = new Webhooks(this);
		this.templates = new Templates(this);
		this.metrics = new MetricsResource(this);
	}

	async request<T>(method: string, path: string, body?: unknown): Promise<T> {
		const url = `${this.baseUrl}${path}`;
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeout);

		try {
			const res = await fetch(url, {
				method,
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
					"Content-Type": "application/json",
					"User-Agent": "buchida-node/0.2.1",
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			if (!res.ok) {
				const errorBody = ((await res.json().catch(() => ({
					message: res.statusText,
				}))) ?? {}) as ApiErrorBody;
				throw this.createError(res.status, errorBody);
			}

			if (res.status === 204) {
				return undefined as T;
			}

			return (await res.json()) as T;
		} finally {
			clearTimeout(timer);
		}
	}

	private createError(status: number, body: ApiErrorBody): BuchidaError {
		const nested = body.error && typeof body.error === "object" ? body.error : undefined;
		const message = nested?.message || body.message || "Unknown error";
		const code = nested?.code || body.code;
		switch (status) {
			case 401:
				return new AuthenticationError(message, code);
			case 404:
				return new NotFoundError(message, code);
			case 422:
				return new ValidationError(message, code);
			case 429:
				return new RateLimitError(message, code);
			default:
				return new BuchidaError(message, status, code);
		}
	}
}

// ── Response envelope handling ──────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Attach a non-enumerable, deprecated `data` property pointing back at `value`, so legacy
 * `res.data.id` keeps working without showing up in `Object.keys`, spreads or JSON.
 * Primitives (and nullish values) are returned untouched.
 */
function withLegacyEnvelope<T>(value: T): WithLegacyData<T> {
	if (typeof value !== "object" || value === null) return value as WithLegacyData<T>;
	if (!Object.prototype.hasOwnProperty.call(value, "data")) {
		Object.defineProperty(value, "data", {
			value,
			enumerable: false,
			writable: true,
			configurable: true,
		});
	}
	return value as WithLegacyData<T>;
}

/** `{ data: T }` → `T` (bare bodies pass through), then attach the legacy alias. */
function unwrap<T>(body: unknown): WithLegacyData<T> {
	const inner = isObject(body) && "data" in body ? body.data : body;
	return withLegacyEnvelope(inner as T);
}

// ── Serialisation ───────────────────────────────────────────────────────────

const WIRE_KEYS: Record<string, string> = {
	fromName: "from_name",
	replyTo: "reply_to",
	scheduledAt: "scheduled_at",
};

/**
 * camelCase params → the snake_case body the API reads. Keys without a mapping
 * pass through unchanged, so extra fields (e.g. template_id) are not dropped.
 */
function toWireBody(p: SendEmailParams): SendEmailWireBody {
	const wire: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(p)) {
		if (value === undefined) continue;
		wire[WIRE_KEYS[key] ?? key] = value;
	}
	return wire as unknown as SendEmailWireBody;
}

// ── Resource Classes ────────────────────────────────────────────────────────

class Emails {
	constructor(private client: Buchida) {}

	async send(params: SendEmailParams): Promise<WithLegacyData<SendEmailResponse>> {
		return unwrap(await this.client.request<unknown>("POST", "/emails", toWireBody(params)));
	}

	async get(id: string): Promise<WithLegacyData<Email>> {
		return unwrap(await this.client.request<unknown>("GET", `/emails/${id}`));
	}

	/** Returns the API envelope unchanged: `{ data, cursor, hasMore }`. */
	async list(params: ListEmailsParams = {}): Promise<ListEmailsResponse> {
		const query = new URLSearchParams();
		if (params.cursor) query.set("cursor", params.cursor);
		if (params.limit) query.set("limit", String(params.limit));
		if (params.status) query.set("status", params.status);
		if (params.from) query.set("from", params.from);
		if (params.to) query.set("to", params.to);
		const qs = query.toString();
		return this.client.request<ListEmailsResponse>("GET", `/emails${qs ? `?${qs}` : ""}`);
	}

	/** Resolves to the cancelled email (was `void` before 0.2). */
	async cancel(id: string): Promise<WithLegacyData<Email>> {
		return unwrap(await this.client.request<unknown>("POST", `/emails/${id}/cancel`));
	}

	/** Per-item results, in input order; check `error` on each item. */
	async sendBatch(emails: SendEmailParams[]): Promise<WithLegacyData<BatchSendResult[]>> {
		return unwrap(
			await this.client.request<unknown>("POST", "/emails/batch", emails.map(toWireBody)),
		);
	}
}

class Domains {
	constructor(private client: Buchida) {}

	async create(params: CreateDomainParams): Promise<WithLegacyData<Domain>> {
		return unwrap(await this.client.request<unknown>("POST", "/domains", params));
	}

	async list(): Promise<WithLegacyData<Domain[]>> {
		return unwrap(await this.client.request<unknown>("GET", "/domains"));
	}

	async get(id: string): Promise<WithLegacyData<Domain>> {
		return unwrap(await this.client.request<unknown>("GET", `/domains/${id}`));
	}

	async verify(id: string): Promise<WithLegacyData<Domain>> {
		return unwrap(await this.client.request<unknown>("POST", `/domains/${id}/verify`));
	}
}

class ApiKeys {
	constructor(private client: Buchida) {}

	async create(params: CreateApiKeyParams): Promise<WithLegacyData<ApiKey>> {
		return unwrap(await this.client.request<unknown>("POST", "/api-keys", params));
	}

	async list(): Promise<WithLegacyData<ApiKey[]>> {
		return unwrap(await this.client.request<unknown>("GET", "/api-keys"));
	}

	async delete(id: string): Promise<void> {
		await this.client.request<void>("DELETE", `/api-keys/${id}`);
	}
}

class Webhooks {
	constructor(private client: Buchida) {}

	async create(params: CreateWebhookParams): Promise<WithLegacyData<Webhook>> {
		return unwrap(await this.client.request<unknown>("POST", "/webhooks", params));
	}

	async list(): Promise<WithLegacyData<Webhook[]>> {
		return unwrap(await this.client.request<unknown>("GET", "/webhooks"));
	}

	async delete(id: string): Promise<void> {
		await this.client.request<void>("DELETE", `/webhooks/${id}`);
	}
}

class Templates {
	constructor(private client: Buchida) {}

	async list(): Promise<WithLegacyData<Template[]>> {
		return unwrap(await this.client.request<unknown>("GET", "/templates"));
	}

	async get(id: string): Promise<WithLegacyData<Template>> {
		return unwrap(await this.client.request<unknown>("GET", `/templates/${id}`));
	}
}

class MetricsResource {
	constructor(private client: Buchida) {}

	async get(params: GetMetricsParams): Promise<WithLegacyData<Metrics>> {
		const query = new URLSearchParams();
		// The API filters on from_date/to_date; plain from/to were silently ignored.
		query.set("from_date", params.from);
		query.set("to_date", params.to);
		return unwrap(await this.client.request<unknown>("GET", `/metrics?${query.toString()}`));
	}
}
