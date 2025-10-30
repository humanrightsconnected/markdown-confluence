/**
 * Global settings that control how Markdown is discovered and published to Confluence.
 */
export type ConfluenceSettings = {
	confluenceBaseUrl: string;
	confluenceParentId: string;
	atlassianUserName: string;
	atlassianApiToken: string;
	folderToPublish: string;
	contentRoot: string;
	firstHeadingPageTitle: boolean;
};

/**
 * Default values for {@link ConfluenceSettings}.
 */
export const DEFAULT_SETTINGS: ConfluenceSettings = {
	confluenceBaseUrl: "",
	confluenceParentId: "",
	atlassianUserName: "",
	atlassianApiToken: "",
	folderToPublish: "Confluence Pages",
	contentRoot: process.cwd(),
	firstHeadingPageTitle: false,
};
