import { Api, Callback, Client, Config, RequestConfig } from "confluence.js";
import { requestUrl } from "obsidian";
import { RequiredConfluenceClient } from "@markdown-confluence/lib";

const ATLASSIAN_TOKEN_CHECK_FLAG = "X-Atlassian-Token";
const ATLASSIAN_TOKEN_CHECK_NOCHECK_VALUE = "no-check";

/**
 * Generates the Authorization header value from the authentication config.
 *
 * Supports Basic authentication using email and apiToken from the config.
 * This is a local implementation to avoid dependency on confluence.js internal functions.
 *
 * @param authentication - The authentication configuration
 * @returns The Authorization header value
 */
function getAuthorizationHeader(
	authentication: Config["authentication"],
): string {
	if (!authentication) {
		throw new Error("Authentication configuration is required");
	}

	if ("basic" in authentication && authentication.basic) {
		const { email, apiToken } = authentication.basic;
		const credentials = `${email}:${apiToken}`;
		const encoded = Buffer.from(credentials).toString("base64");
		return `Basic ${encoded}`;
	}

	throw new Error("Unsupported authentication type");
}

/**
 * Sanitizes a RequestConfig object for safe logging by removing sensitive data.
 *
 * This function removes or redacts fields that could contain sensitive information:
 * - Authorization, Cookie, and other authentication-related headers
 * - Request body data
 * - Authentication credentials
 *
 * @param requestConfig - The request configuration to sanitize
 * @returns A sanitized copy safe for logging
 */
function sanitizeRequestConfig(requestConfig: RequestConfig): {
	method?: string;
	url?: string;
	params?: unknown;
	headers?: Record<string, string>;
	data?: string;
} {
	const sanitized: {
		method?: string;
		url?: string;
		params?: unknown;
		headers?: Record<string, string>;
		data?: string;
	} = {};

	// Include basic request info
	if (requestConfig.method !== undefined) {
		sanitized.method = requestConfig.method;
	}
	if (requestConfig.url !== undefined) {
		sanitized.url = requestConfig.url;
	}
	if (requestConfig.params !== undefined) {
		sanitized.params = requestConfig.params;
	}

	// Sanitize headers if present
	if (requestConfig.headers) {
		const sanitizedHeaders: Record<string, string> = {};
		const sensitiveHeaderPatterns = [
			/^authorization$/i,
			/^cookie$/i,
			/^x-api-key$/i,
			/^api-key$/i,
			/^api-token$/i,
			/^auth/i,
		];

		Object.entries(requestConfig.headers).forEach(([key, value]) => {
			const isSensitive = sensitiveHeaderPatterns.some((pattern) =>
				pattern.test(key),
			);
			sanitizedHeaders[key] = isSensitive
				? "[REDACTED]"
				: (value?.toString() ?? "");
		});

		sanitized.headers = sanitizedHeaders;
	}

	// Do not include the request body/data as it might contain sensitive information
	// Only indicate whether data was present
	if (requestConfig.data !== undefined) {
		sanitized.data = "[REDACTED]";
	}

	return sanitized;
}

export class MyBaseClient implements Client {
	protected urlSuffix = "/wiki/rest";

	constructor(protected readonly config: Config) {}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected paramSerializer(parameters: Record<string, any>): string {
		const parts: string[] = [];

		Object.entries(parameters).forEach(([key, value]) => {
			if (value === null || typeof value === "undefined") {
				return;
			}

			if (Array.isArray(value)) {
				value = value.join(",");
			}

			if (value instanceof Date) {
				value = value.toISOString();
			} else if (value !== null && typeof value === "object") {
				value = JSON.stringify(value);
			} else if (value instanceof Function) {
				const part = value();

				return part && parts.push(part);
			}

			parts.push(`${this.encode(key)}=${this.encode(value)}`);

			return;
		});

		return parts.join("&");
	}

	protected encode(value: string) {
		return encodeURIComponent(value)
			.replace(/%3A/gi, ":")
			.replace(/%24/g, "$")
			.replace(/%2C/gi, ",")
			.replace(/%20/g, "+")
			.replace(/%5B/gi, "[")
			.replace(/%5D/gi, "]");
	}

	protected removeUndefinedProperties(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		obj: Record<string, any>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): Record<string, any> {
		return Object.entries(obj)
			.filter(([, value]) => typeof value !== "undefined")
			.reduce(
				(accumulator, [key, value]) => ({
					...accumulator,
					[key]: value,
				}),
				{},
			);
	}

	async sendRequest<T>(
		requestConfig: RequestConfig,
		callback: never,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		telemetryData?: any,
	): Promise<T>;
	async sendRequest<T>(
		requestConfig: RequestConfig,
		callback: Callback<T>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		telemetryData?: any,
	): Promise<void>;
	async sendRequest<T>(
		requestConfig: RequestConfig,
		callback: Callback<T> | never,
	): Promise<void | T> {
		try {
			const contentType = (requestConfig.headers ?? {})[
				"content-type"
			]?.toString();
			if (requestConfig.headers && contentType) {
				requestConfig.headers["Content-Type"] = contentType;
				delete requestConfig?.headers["content-type"];
			}

			const params = this.paramSerializer(requestConfig.params);

			const requestContentType =
				(requestConfig.headers ?? {})["Content-Type"]?.toString() ??
				"application/json";

			const requestBody = requestContentType.startsWith(
				"multipart/form-data",
			)
				? [
						requestConfig.data.getHeaders(),
						requestConfig.data.getBuffer().buffer,
					]
				: [{}, JSON.stringify(requestConfig.data)];

			const modifiedRequestConfig = {
				...requestConfig,
				headers: this.removeUndefinedProperties({
					"User-Agent": "Obsidian.md",
					Accept: "application/json",
					[ATLASSIAN_TOKEN_CHECK_FLAG]: this.config
						.noCheckAtlassianToken
						? ATLASSIAN_TOKEN_CHECK_NOCHECK_VALUE
						: undefined,
					...this.config.baseRequestConfig?.headers,
					Authorization: getAuthorizationHeader(
						this.config.authentication,
					),
					...requestConfig.headers,
					"Content-Type": requestContentType,
					...requestBody[0],
				}),
				url: `${this.config.host}${this.urlSuffix}${requestConfig.url}?${params}`,
				body: requestBody[1],
				method: requestConfig.method?.toUpperCase() ?? "GET",
				contentType: requestContentType,
				throw: false,
			};
			delete modifiedRequestConfig.data;

			const response = await requestUrl(modifiedRequestConfig);

			if (response.status >= 400) {
				throw new HTTPError(`Received a ${response.status}`, {
					status: response.status,
					data: response.text,
				});
			}

			const callbackResponseHandler =
				callback && ((data: T): void => callback(null, data));
			const defaultResponseHandler = (data: T): T => data;

			const responseHandler =
				callbackResponseHandler ?? defaultResponseHandler;

			this.config.middlewares?.onResponse?.(response.json);

			return responseHandler(response.json);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			console.warn({
				httpError: e,
				requestConfig: sanitizeRequestConfig(requestConfig),
			});

			// Transform the error for the callback.
			// Note: The middleware receives the raw error `e` (which includes .response),
			// while the callback receives this transformed error for serialization compatibility.
			// Mark as non-Axios error
			const axiosLikeError = {
				...e,
				isAxiosError: false,
				toJSON: () => ({
					message: e.message,
					name: e.name,
					...e,
				}),
			};

			const callbackErrorHandler =
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				callback && ((error: any) => callback(error));
			const defaultErrorHandler = (error: Error) => {
				throw error;
			};

			const errorHandler = callbackErrorHandler ?? defaultErrorHandler;

			// Middleware receives the raw error with .response property
			this.config.middlewares?.onError?.(e);

			return errorHandler(axiosLikeError);
		}
	}
}

export interface ErrorData {
	data: unknown;
	status: number;
}

export class HTTPError extends Error {
	constructor(
		msg: string,
		public response: ErrorData,
	) {
		super(msg);

		// Set the prototype explicitly.
		Object.setPrototypeOf(this, HTTPError.prototype);
	}
}

export class ObsidianConfluenceClient
	extends MyBaseClient
	implements RequiredConfluenceClient
{
	content = new Api.Content(this);
	space = new Api.Space(this);
	contentAttachments = new Api.ContentAttachments(this);
	contentLabels = new Api.ContentLabels(this);
	users = new Api.Users(this);
}
