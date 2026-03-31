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
	Template,
	Webhook,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.buchida.com";
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
					"User-Agent": "buchida-node/0.1.0",
				},
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			if (!res.ok) {
				const errorBody = (await res.json().catch(() => ({
					message: res.statusText,
				}))) as ApiErrorBody;
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
		const message = body.message || "Unknown error";
		switch (status) {
			case 401:
				return new AuthenticationError(message);
			case 404:
				return new NotFoundError(message);
			case 422:
				return new ValidationError(message);
			case 429:
				return new RateLimitError(message);
			default:
				return new BuchidaError(message, status, body.code);
		}
	}
}

// ── Resource Classes ────────────────────────────────────────────────────────

class Emails {
	constructor(private client: Buchida) {}

	async send(params: SendEmailParams): Promise<SendEmailResponse> {
		return this.client.request<SendEmailResponse>("POST", "/emails", params);
	}

	async get(id: string): Promise<Email> {
		return this.client.request<Email>("GET", `/emails/${id}`);
	}

	async list(params: ListEmailsParams = {}): Promise<ListEmailsResponse> {
		const query = new URLSearchParams();
		if (params.cursor) query.set("cursor", params.cursor);
		if (params.limit) query.set("limit", String(params.limit));
		if (params.status) query.set("status", params.status);
		if (params.from) query.set("from", params.from);
		if (params.to) query.set("to", params.to);
		const qs = query.toString();
		return this.client.request<ListEmailsResponse>(
			"GET",
			`/emails${qs ? `?${qs}` : ""}`,
		);
	}

	async cancel(id: string): Promise<void> {
		await this.client.request<void>("POST", `/emails/${id}/cancel`);
	}

	async sendBatch(emails: SendEmailParams[]): Promise<SendEmailResponse[]> {
		return this.client.request<SendEmailResponse[]>(
			"POST",
			"/emails/batch",
			emails,
		);
	}
}

class Domains {
	constructor(private client: Buchida) {}

	async create(params: CreateDomainParams): Promise<Domain> {
		return this.client.request<Domain>("POST", "/domains", params);
	}

	async list(): Promise<Domain[]> {
		return this.client.request<Domain[]>("GET", "/domains");
	}

	async get(id: string): Promise<Domain> {
		return this.client.request<Domain>("GET", `/domains/${id}`);
	}

	async verify(id: string): Promise<Domain> {
		return this.client.request<Domain>("POST", `/domains/${id}/verify`);
	}
}

class ApiKeys {
	constructor(private client: Buchida) {}

	async create(params: CreateApiKeyParams): Promise<ApiKey> {
		return this.client.request<ApiKey>("POST", "/api-keys", params);
	}

	async list(): Promise<ApiKey[]> {
		return this.client.request<ApiKey[]>("GET", "/api-keys");
	}

	async delete(id: string): Promise<void> {
		await this.client.request<void>("DELETE", `/api-keys/${id}`);
	}
}

class Webhooks {
	constructor(private client: Buchida) {}

	async create(params: CreateWebhookParams): Promise<Webhook> {
		return this.client.request<Webhook>("POST", "/webhooks", params);
	}

	async list(): Promise<Webhook[]> {
		return this.client.request<Webhook[]>("GET", "/webhooks");
	}

	async delete(id: string): Promise<void> {
		await this.client.request<void>("DELETE", `/webhooks/${id}`);
	}
}

class Templates {
	constructor(private client: Buchida) {}

	async list(): Promise<Template[]> {
		return this.client.request<Template[]>("GET", "/templates");
	}

	async get(id: string): Promise<Template> {
		return this.client.request<Template>("GET", `/templates/${id}`);
	}
}

class MetricsResource {
	constructor(private client: Buchida) {}

	async get(params: GetMetricsParams): Promise<Metrics> {
		const query = new URLSearchParams();
		query.set("from", params.from);
		query.set("to", params.to);
		if (params.granularity) query.set("granularity", params.granularity);
		return this.client.request<Metrics>("GET", `/metrics?${query.toString()}`);
	}
}
