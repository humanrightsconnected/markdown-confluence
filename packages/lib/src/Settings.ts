/**
 * Global settings that control how Markdown is discovered and published to Confluence.
 */
export type ConfluenceSettings = {
	confluenceBaseUrl: string;
	confluenceParentId: string;
	confluenceSpaceKey?: string;
	atlassianUserName: string;
	atlassianApiToken: string;
	folderToPublish: string;
	contentRoot: string;
	firstHeadingPageTitle: boolean;
};

/**
 * Default values for {@link ConfluenceSettings}.
 *
 * Note: contentRoot is intentionally set to empty string as a placeholder.
 * The DefaultSettingsLoader will provide process.cwd() at runtime to avoid
 * capturing the working directory at module load time.
 */
export const DEFAULT_SETTINGS: Readonly<ConfluenceSettings> = {
	confluenceBaseUrl: "",
	confluenceParentId: "",
	atlassianUserName: "",
	atlassianApiToken: "",
	folderToPublish: "Confluence Pages",
	contentRoot: "",
	firstHeadingPageTitle: false,
};
