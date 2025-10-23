import { ConfluenceSettings } from "../Settings";
import { SettingsLoader } from "./SettingsLoader";

/**
 * Loads Confluence settings from environment variables.
 *
 * Reads configuration from the following environment variables:
 * - CONFLUENCE_BASE_URL: Confluence base URL
 * - CONFLUENCE_PARENT_ID: Parent page ID
 * - ATLASSIAN_USERNAME: Atlassian user name
 * - ATLASSIAN_API_TOKEN: Atlassian API token
 * - FOLDER_TO_PUBLISH: Folder to publish
 * - CONFLUENCE_CONTENT_ROOT: Content root directory
 * - CONFLUENCE_FIRST_HEADING_PAGE_TITLE: Whether to use first heading as page title (1/true/yes or 0/false/no)
 */
export class EnvironmentVariableSettingsLoader extends SettingsLoader {
	/**
	 * Gets a configuration value from an environment variable.
	 *
	 * @param propertyKey - The key of the ConfluenceSettings property to set
	 * @param envVar - The name of the environment variable to read
	 * @returns A partial ConfluenceSettings object with the property set if the
	 *          environment variable exists, or an empty object otherwise
	 */
	getValue<T extends keyof ConfluenceSettings>(
		propertyKey: T,
		envVar: string,
	): Partial<ConfluenceSettings> {
		const value = process.env[envVar];
		return value ? { [propertyKey]: value } : {};
	}

	/**
	 * Parses a boolean value from an environment variable.
	 *
	 * Accepts the following truthy values (case-insensitive): "1", "true", "yes"
	 * Accepts the following falsy values (case-insensitive): "0", "false", "no"
	 *
	 * @param envVar - The name of the environment variable to read
	 * @returns The parsed boolean value, or undefined if the env var is not set or invalid
	 */
	private getBooleanValue(envVar: string): boolean | undefined {
		const value = process.env[envVar];
		if (value === undefined) {
			return undefined;
		}

		const normalized = value.toLowerCase().trim();
		if (["1", "true", "yes"].includes(normalized)) {
			return true;
		}
		if (["0", "false", "no"].includes(normalized)) {
			return false;
		}

		return undefined;
	}

	/**
	 * Loads partial Confluence settings from environment variables.
	 *
	 * Reads all supported environment variables and combines them into a
	 * partial settings object. Only environment variables that are set will
	 * be included in the result.
	 *
	 * @returns A partial ConfluenceSettings object containing settings from environment variables
	 */
	loadPartial(): Partial<ConfluenceSettings> {
		const result: Partial<ConfluenceSettings> = {
			...this.getValue("confluenceBaseUrl", "CONFLUENCE_BASE_URL"),
			...this.getValue("confluenceParentId", "CONFLUENCE_PARENT_ID"),
			...this.getValue("atlassianUserName", "ATLASSIAN_USERNAME"),
			...this.getValue("atlassianApiToken", "ATLASSIAN_API_TOKEN"),
			...this.getValue("folderToPublish", "FOLDER_TO_PUBLISH"),
			...this.getValue("contentRoot", "CONFLUENCE_CONTENT_ROOT"),
		};

		// Only set boolean fields if the environment variable is explicitly provided
		const firstHeadingPageTitle = this.getBooleanValue(
			"CONFLUENCE_FIRST_HEADING_PAGE_TITLE",
		);
		if (firstHeadingPageTitle !== undefined) {
			result.firstHeadingPageTitle = firstHeadingPageTitle;
		}

		return result;
	}
}
