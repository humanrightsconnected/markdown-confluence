import { describe, it, expect } from "@jest/globals";
import { cleanUpUrlIfConfluence } from "./ConfluenceUrlParser";

describe("cleanUpUrlIfConfluence", () => {
	const confluenceBaseUrl = "https://example.atlassian.net";

	describe("valid Confluence URLs", () => {
		it("should canonicalize standard space URLs", () => {
			const input =
				"https://example.atlassian.net/wiki/spaces/MYSPACE/pages/123/Page+Title";
			const expected =
				"https://example.atlassian.net/wiki/spaces/MYSPACE/pages/123";
			expect(cleanUpUrlIfConfluence(input, confluenceBaseUrl)).toBe(
				expected,
			);
		});

		it("should preserve tilde prefix for personal spaces", () => {
			const input =
				"https://example.atlassian.net/wiki/spaces/~username/pages/456/Personal+Page";
			const expected =
				"https://example.atlassian.net/wiki/spaces/~username/pages/456";
			expect(cleanUpUrlIfConfluence(input, confluenceBaseUrl)).toBe(
				expected,
			);
		});

		it("should support hyphens in space keys", () => {
			const input =
				"https://example.atlassian.net/wiki/spaces/my-space-key/pages/789/Some+Page";
			const expected =
				"https://example.atlassian.net/wiki/spaces/my-space-key/pages/789";
			expect(cleanUpUrlIfConfluence(input, confluenceBaseUrl)).toBe(
				expected,
			);
		});

		it("should handle URLs without trailing slug", () => {
			const input =
				"https://example.atlassian.net/wiki/spaces/MYSPACE/pages/123";
			const expected =
				"https://example.atlassian.net/wiki/spaces/MYSPACE/pages/123";
			expect(cleanUpUrlIfConfluence(input, confluenceBaseUrl)).toBe(
				expected,
			);
		});

		it("should preserve query parameters and fragments", () => {
			const input =
				"https://example.atlassian.net/wiki/spaces/MYSPACE/pages/123/Page+Title?query=param#section";
			const expected =
				"https://example.atlassian.net/wiki/spaces/MYSPACE/pages/123?query=param#section";
			expect(cleanUpUrlIfConfluence(input, confluenceBaseUrl)).toBe(
				expected,
			);
		});
	});

	describe("non-Confluence URLs", () => {
		it("should return input unchanged for different hostname", () => {
			const input =
				"https://other-domain.com/wiki/spaces/MYSPACE/pages/123";
			expect(cleanUpUrlIfConfluence(input, confluenceBaseUrl)).toBe(
				input,
			);
		});

		it("should return input unchanged for non-matching path format", () => {
			const input = "https://example.atlassian.net/some/other/path";
			expect(cleanUpUrlIfConfluence(input, confluenceBaseUrl)).toBe(
				input,
			);
		});
	});

	describe("invalid inputs", () => {
		it("should return # for invalid URLs", () => {
			const input = "not a valid url";
			expect(cleanUpUrlIfConfluence(input, confluenceBaseUrl)).toBe("#");
		});

		it("should return # for empty string", () => {
			const input = "";
			expect(cleanUpUrlIfConfluence(input, confluenceBaseUrl)).toBe("#");
		});
	});
});
