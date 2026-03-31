// ── Client Options ──────────────────────────────────────────────────────────

export interface BuchidaOptions {
	baseUrl?: string;
	timeout?: number;
}

// ── Email Types ─────────────────────────────────────────────────────────────

export interface SendEmailParams {
	from: string;
	to: string | string[];
	subject: string;
	html?: string;
	text?: string;
	replyTo?: string;
	cc?: string | string[];
	bcc?: string | string[];
	tags?: Record<string, string>;
	scheduledAt?: string;
}

export interface Email {
	id: string;
	from: string;
	to: string[];
	subject: string;
	html?: string;
	text?: string;
	status: string;
	createdAt: string;
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
}

export interface SendEmailResponse {
	id: string;
}

// ── Domain Types ────────────────────────────────────────────────────────────

export interface CreateDomainParams {
	name: string;
}

export interface Domain {
	id: string;
	name: string;
	status: string;
	records: DnsRecord[];
	createdAt: string;
}

export interface DnsRecord {
	type: string;
	name: string;
	value: string;
	verified: boolean;
}

// ── API Key Types ───────────────────────────────────────────────────────────

export interface CreateApiKeyParams {
	name: string;
	permission: "full_access" | "sending_access";
}

export interface ApiKey {
	id: string;
	name: string;
	key?: string;
	permission: string;
	createdAt: string;
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
	createdAt: string;
}

// ── Template Types ──────────────────────────────────────────────────────────

export interface Template {
	id: string;
	name: string;
	subject?: string;
	html?: string;
	createdAt: string;
}

// ── Metrics Types ───────────────────────────────────────────────────────────

export interface GetMetricsParams {
	from: string;
	to: string;
	granularity?: "hour" | "day" | "week" | "month";
}

export interface Metrics {
	sent: number;
	delivered: number;
	opened: number;
	clicked: number;
	bounced: number;
	complained: number;
	timeseries: MetricsDataPoint[];
}

export interface MetricsDataPoint {
	timestamp: string;
	sent: number;
	delivered: number;
	opened: number;
	clicked: number;
	bounced: number;
	complained: number;
}

// ── Error Types ─────────────────────────────────────────────────────────────

export interface ApiErrorBody {
	message: string;
	code?: string;
}
