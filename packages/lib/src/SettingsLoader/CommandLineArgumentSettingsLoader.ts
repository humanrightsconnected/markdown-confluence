import { ConfluenceSettings } from "../Settings";
import { SettingsLoader } from "./SettingsLoader";
import yargs from "yargs";

/**
 * Loads Confluence settings from command-line arguments.
 *
 * Parses command-line arguments using yargs to extract Confluence configuration.
 * Supports the following command-line options:
 * - --baseUrl, -b: Confluence base URL
 * - --parentId, -p: Confluence parent page ID
 * - --userName, -u: Atlassian user name
 * - --apiToken: Atlassian API token
 * - --enableFolder, -f: Folder to enable for publishing
 * - --contentRoot, -cr: Root directory for content files
 * - --firstHeaderPageTitle, -fh: Use first header as page title
 */
export class CommandLineArgumentSettingsLoader extends SettingsLoader {
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
	 * Loads partial Confluence settings from command-line arguments.
	 *
	 * Parses process.argv to extract command-line options and maps them to
	 * ConfluenceSettings properties. Only provided options are included in the result.
	 *
	 * @returns A partial ConfluenceSettings object containing settings from command-line arguments
	 */
	loadPartial(): Partial<ConfluenceSettings> {
		const yargsInstance = yargs(process.argv)
			.usage("Usage: $0 [options]")
			.option("baseUrl", {
				alias: "b",
				describe: "Confluence base URL",
				type: "string",
				demandOption: false,
			})
			.option("parentId", {
				alias: "p",
				describe: "Confluence parent ID",
				type: "string",
				demandOption: false,
			})
			.option("userName", {
				alias: "u",
				describe: "Atlassian user name",
				type: "string",
				demandOption: false,
			})
			.option("apiToken", {
				describe: "Atlassian API token",
				type: "string",
				demandOption: false,
			})
			.option("enableFolder", {
				alias: "f",
				describe: "Folder enable to publish",
				type: "string",
				demandOption: false,
			})
			.option("contentRoot", {
				alias: "cr",
				describe:
					"Root to search for files to publish. All files must be part of this directory.",
				type: "string",
				demandOption: false,
			})
			.option("firstHeaderPageTitle", {
				alias: "fh",
				describe:
					"Replace page title with first header element when 'connie-title' isn't specified.",
				type: "boolean",
				demandOption: false,
			});

		// Use parseSync to ensure synchronous parsing in yargs v18+
		// Type assertion needed due to outdated @types/yargs package
		const options = (yargsInstance as any).parseSync() as {
			baseUrl?: string;
			parentId?: string;
			userName?: string;
			apiToken?: string;
			enableFolder?: string;
			contentRoot?: string;
			firstHeaderPageTitle?: boolean;
		};

		return {
			...(options.baseUrl
				? { confluenceBaseUrl: options.baseUrl }
				: undefined),
			...(options.parentId
				? { confluenceParentId: options.parentId }
				: undefined),
			...(options.userName
				? { atlassianUserName: options.userName }
				: undefined),
			...(options.apiToken
				? { atlassianApiToken: options.apiToken }
				: undefined),
			...(options.enableFolder
				? { folderToPublish: options.enableFolder }
				: undefined),
			...(options.contentRoot
				? { contentRoot: options.contentRoot }
				: undefined),
			...(options.firstHeaderPageTitle
				? { firstHeadingPageTitle: options.firstHeaderPageTitle }
				: undefined),
		};
	}
}
