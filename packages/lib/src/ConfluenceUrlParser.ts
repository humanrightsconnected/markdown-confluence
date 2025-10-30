/**
 * Normalize Confluence page URLs to a canonical form, preserving only space and page ID.
 *
 * If the URL does not match the target Confluence hostname, the input is returned unchanged.
 * Non-URL inputs return a fallback of `#`.
 *
 * @param input Any string that may be a URL.
 * @param confluenceBaseUrl Base URL of the Confluence instance to match against.
 * @returns Canonicalized URL for Confluence pages or the original input/fallback.
 */
export function cleanUpUrlIfConfluence(
	input: string,
	confluenceBaseUrl: string,
): string {
	let url: URL;

	// Check if the input is a valid URL
	try {
		url = new URL(input);
	} catch {
		return "#";
	}

	const confluenceUrl = new URL(confluenceBaseUrl);
	if (url.hostname !== confluenceUrl.hostname) {
		return input;
	}

	// Check if the input matches the specified path format
	// Captures:
	//   [1] - space key (including optional ~ prefix for personal spaces and hyphens)
	//   [2] - page ID
	//   [3] - optional trailing slug (to be removed in canonical form)
	const pathRegex = /\/wiki\/spaces\/(~?[\w-]+)\/pages\/(\d+)(?:\/(\w*))?/;
	const matches = url.pathname.match(pathRegex);

	if (matches) {
		// Update the pathname to remove the last optional part while preserving space key and tilde
		url.pathname = `/wiki/spaces/${matches[1]}/pages/${matches[2]}`;

		// Return the updated URL
		return url.href;
	}

	return input;
}
