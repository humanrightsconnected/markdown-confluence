import { ConfluenceSettings } from "../Settings";

/**
 * Abstract base class for loading Confluence settings from various sources.
 *
 * Settings loaders provide a flexible architecture for loading configuration
 * from different sources (files, environment variables, command-line args, etc.).
 * Each loader implements the loadPartial() method to provide partial settings,
 * which can then be validated and combined with other loaders.
 */
export abstract class SettingsLoader {
	/**
	 * Loads partial Confluence settings from the specific source.
	 *
	 * This method must be implemented by concrete loader classes to provide
	 * settings from their specific source (e.g., config file, environment variables).
	 *
	 * @returns A partial ConfluenceSettings object with zero or more settings populated
	 */
	abstract loadPartial(): Partial<ConfluenceSettings>;

	/**
	 * Loads and validates complete Confluence settings.
	 *
	 * This method calls loadPartial() to get the settings, validates that all
	 * required settings are present, and returns a complete ConfluenceSettings object.
	 *
	 * @returns A complete and validated ConfluenceSettings object
	 * @throws Error if any required settings are missing
	 */
	load(): ConfluenceSettings {
		const initialSettings = this.loadPartial();
		const settings = this.validateSettings(initialSettings);
		return settings;
	}

	/**
	 * Validates that all required settings are present and normalizes values.
	 *
	 * Ensures that required fields (baseUrl, parentId, userName, apiToken,
	 * folderToPublish, contentRoot) are present and normalizes values where needed
	 * (e.g., ensures contentRoot ends with a slash).
	 *
	 * @param settings - Partial settings to validate
	 * @returns Complete ConfluenceSettings object with normalized values
	 * @throws Error if any required setting is missing
	 */
	protected validateSettings(
		settings: Partial<ConfluenceSettings>,
	): ConfluenceSettings {
		if (!settings.confluenceBaseUrl) {
			throw new Error("Confluence base URL is required");
		}

		if (!settings.confluenceParentId) {
			throw new Error("Confluence parent ID is required");
		}

		if (!settings.atlassianUserName) {
			throw new Error("Atlassian user name is required");
		}

		if (!settings.atlassianApiToken) {
			throw new Error("Atlassian API token is required");
		}

		if (!settings.folderToPublish) {
			throw new Error("Folder to publish is required");
		}

		if (!settings.contentRoot) {
			throw new Error("Content root is required");
		}

		// Normalize contentRoot: ensure it ends with a trailing slash
		// Check for both forward slash (/) and backslash (\) for Windows compatibility
		const endsWithSlash = /[\\/]+$/.test(settings.contentRoot);
		const normalizedContentRoot = endsWithSlash
			? settings.contentRoot
			: `${settings.contentRoot}/`;

		// Return a new object to avoid mutating the input
		return {
			...settings,
			contentRoot: normalizedContentRoot,
			firstHeadingPageTitle: settings.firstHeadingPageTitle ?? false,
		} as ConfluenceSettings;
	}
}
