// ── Client Options ──────────────────────────────────────────────────────────

export interface BuchidaOptions {
	baseUrl?: string;
	timeout?: number;
}

// ── Email Types ─────────────────────────────────────────────────────────────

export interface SendEmailParams {
	/** Sender address. May also be RFC 5322 form, e.g. `"Vyblor <hello@vyblor.com>"`. */
	from: string;
	/** Sender display name (serialised as `from_name`). Wins over a name embedded in `from`. */
	fromName?: string;
	to: string | string[];
	subject: string;
	html?: string;
	text?: string;
	replyTo?: string;
	cc?: string | string[];
	bcc?: string | string[];
	tags?: Record<string, string>;
	/**
	 * ISO 8601 date-time, sent as `scheduled_at`. Stored and returned by the API, but not yet
	 * honoured: the email is sent immediately. An unparseable value is rejected with 422.
	 */
	scheduledAt?: string;
}

/** Response fields are snake_case, exactly as the API returns them. */
export interface Email {
	id: string;
	from: string;
	from_name: string | null;
	to: string[];
	subject: string;
	html: string | null;
	text: string | null;
	reply_to: string | null;
	cc: string[] | null;
	bcc: string[] | null;
	status: string;
	direction: "inbound" | "outbound" | string;
	template_id: string | null;
	tags: Record<string, string> | null;
	scheduled_at: string | null;
	sent_at: string | null;
	delivered_at: string | null;
	received_at?: string | null;
	thread_id?: string | null;
	has_attachments?: boolean;
	created_at: string;
	/** Only present on `emails.get()`: delivery event timeline (newest first). */
	events?: EmailEvent[];
}

export interface EmailEvent {
	id: string;
	type: string;
	timestamp: string;
	data: unknown;
}

export interface ListEmailsParams {
	cursor?: string;
	limit?: number;
	status?: string;
	from?: string;
	to?: string;
}

export interface ListEmailsResponse {
	data: Email[];
	cursor?: string;
	hasMore: boolean;
}

/** `emails.send()` resolves to the created email (the API's `data` payload). */
export type SendEmailResponse = Email;

/** One entry of `emails.sendBatch()`: either the created email or a per-item error. */
export interface BatchSendResult {
	data?: Email;
	error?: { code: string; message: string };
}

/**
 * @deprecated Legacy envelope alias. Responses used to be `{ data: T }`; they are now `T`,
 * with a non-enumerable `data` property pointing back at the same value so `res.data.id`
 * keeps working. Read the fields directly instead.
 */
export type WithLegacyData<T> = T & { readonly data: T };

// ── Domain Types ────────────────────────────────────────────────────────────

export interface CreateDomainParams {
	name: string;
}

export interface Domain {
	id: string;
	name: string;
	status: string;
	region: string;
	dns_provider: string | null;
	verification_token: string | null;
	dkim_verified: boolean;
	spf_verified: boolean;
	dmarc_verified: boolean;
	mx_verified: boolean;
	return_path_verified: boolean;
	verification_verified: boolean;
	last_checked_at: string | null;
	dns_records: DnsRecord[];
	verified_at: string | null;
	created_at: string;
	settings: {
		click_tracking: boolean;
		open_tracking: boolean;
		tls_mode: string;
		[key: string]: unknown;
	};
	default_from_name: string | null;
}

export interface DnsRecord {
	type: string;
	/** Fully-qualified record name. */
	name: string;
	/** Short host label for DNS panels, e.g. `@`, `_dmarc`. */
	displayName: string;
	value: string;
	/** `dkim` | `spf` | `dmarc` | `return_path` | `verification` */
	purpose: string;
	label: string;
	description: string;
}

// ── API Key Types ───────────────────────────────────────────────────────────

export interface CreateApiKeyParams {
	name: string;
	permission: "full_access" | "sending_access";
}

export interface ApiKey {
	id: string;
	name: string;
	/** Full secret; only returned by `apiKeys.create()`. */
	key?: string;
	key_prefix: string;
	permission: string;
	/** Not returned by `apiKeys.create()`. */
	last_used_at?: string | null;
	expires_at: string | null;
	created_at: string;
}

// ── Webhook Types ───────────────────────────────────────────────────────────

export interface CreateWebhookParams {
	url: string;
	events: string[];
}

export interface Webhook {
	id: string;
	url: string;
	events: string[];
	/** Signing secret; only returned by `webhooks.create()`. */
	secret?: string;
	active: boolean;
	created_at: string;
}

// ── Template Types ──────────────────────────────────────────────────────────

export interface Template {
	id: string;
	name: string;
	slug: string | null;
	subject: string;
	status: string;
	category: string | null;
	locale: string;
	html: string;
	text: string | null;
	variables: string[] | null;
	created_at: string;
	updated_at: string;
}

// ── Metrics Types ───────────────────────────────────────────────────────────

export interface GetMetricsParams {
	/** Start of the date filter (ISO 8601), sent as `from_date`. */
	from: string;
	/** End of the date filter (ISO 8601), sent as `to_date`. */
	to: string;
	/** @deprecated The API has no time-series granularity; this value is ignored. */
	granularity?: "hour" | "day" | "week" | "month";
}

/** Shape returned by GET /v1/metrics (all-time totals plus date-filtered totals). */
export interface Metrics {
	total: number;
	by_status: Record<string, number>;
	filtered_total: number;
	filtered_by_status: Record<string, number>;
	delivery_rate: number;
	bounce_rate: number;
	complaint_rate: number;
	[key: string]: unknown;
}

// ── Error Types ─────────────────────────────────────────────────────────────

export interface ApiErrorBody {
	/** Current API shape: `{ error: { code, message } }`. */
	error?: { code?: string; message?: string };
	/** Legacy top-level shape. */
	message?: string;
	code?: string;
}

/** Wire (snake_case) body for POST /v1/emails. */
export interface SendEmailWireBody {
	from: string;
	from_name?: string;
	to: string | string[];
	subject: string;
	html?: string;
	text?: string;
	reply_to?: string;
	cc?: string | string[];
	bcc?: string | string[];
	tags?: Record<string, string>;
	scheduled_at?: string;
}
