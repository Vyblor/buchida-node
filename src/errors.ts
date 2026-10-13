export class BuchidaError extends Error {
	public readonly statusCode: number;
	/**
	 * Generic errors: the API's error code (as in 0.1.x). Typed subclasses keep a fixed legacy
	 * code ("authentication_error", "rate_limit_error", "not_found", "validation_error").
	 */
	public readonly code: string | undefined;
	/** The error code returned by the API (e.g. "invalid_api_key"), set on every error. */
	public readonly apiCode: string | undefined;

	constructor(message: string, statusCode: number, code?: string, apiCode?: string) {
		super(message);
		this.name = "BuchidaError";
		this.statusCode = statusCode;
		this.code = code;
		this.apiCode = apiCode ?? code;
	}
}

export class AuthenticationError extends BuchidaError {
	constructor(message = "Invalid API key", apiCode?: string) {
		super(message, 401, "authentication_error", apiCode);
		this.name = "AuthenticationError";
	}
}

export class RateLimitError extends BuchidaError {
	constructor(message = "Rate limit exceeded", apiCode?: string) {
		super(message, 429, "rate_limit_error", apiCode);
		this.name = "RateLimitError";
	}
}

export class NotFoundError extends BuchidaError {
	constructor(message = "Resource not found", apiCode?: string) {
		super(message, 404, "not_found", apiCode);
		this.name = "NotFoundError";
	}
}

export class ValidationError extends BuchidaError {
	constructor(message = "Validation failed", apiCode?: string) {
		super(message, 422, "validation_error", apiCode);
		this.name = "ValidationError";
	}
}
