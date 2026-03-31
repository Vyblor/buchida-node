export class BuchidaError extends Error {
	public readonly statusCode: number;
	public readonly code: string | undefined;

	constructor(message: string, statusCode: number, code?: string) {
		super(message);
		this.name = "BuchidaError";
		this.statusCode = statusCode;
		this.code = code;
	}
}

export class AuthenticationError extends BuchidaError {
	constructor(message = "Invalid API key") {
		super(message, 401, "authentication_error");
		this.name = "AuthenticationError";
	}
}

export class RateLimitError extends BuchidaError {
	constructor(message = "Rate limit exceeded") {
		super(message, 429, "rate_limit_error");
		this.name = "RateLimitError";
	}
}

export class NotFoundError extends BuchidaError {
	constructor(message = "Resource not found") {
		super(message, 404, "not_found");
		this.name = "NotFoundError";
	}
}

export class ValidationError extends BuchidaError {
	constructor(message = "Validation failed") {
		super(message, 422, "validation_error");
		this.name = "ValidationError";
	}
}
