import { ConfluenceSettings } from "../Settings";
import { SettingsLoader } from "./SettingsLoader";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

/**
 * Type-safe wrapper for yargs parseSync method.
 * Yargs 18 includes parseSync but some transitive dependencies provide
 * outdated @types/yargs that lack this method definition.
 */
interface YargsWithParseSync<T> {
	parseSync(): T;
}

/**
 * Interface defining the CLI options expected by the command-line argument parser.
 */
interface CliOptions {
	baseUrl?: string;
	parentId?: string;
	userName?: string;
	apiToken?: string;
	enableFolder?: string;
	contentRoot?: string;
	firstHeaderPageTitle?: boolean;
}

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
	 * Loads partial Confluence settings from command-line arguments.
	 *
	 * Parses process.argv to extract command-line options and maps them to
	 * ConfluenceSettings properties. Only provided options are included in the result.
	 *
	 * @returns A partial ConfluenceSettings object containing settings from command-line arguments
	 */
	loadPartial(): Partial<ConfluenceSettings> {
		const yargsInstance = yargs(hideBin(process.argv))
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
				describe: "Folder to publish",
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
			}) as unknown as YargsWithParseSync<CliOptions>;

		// Use type-safe parseSync call (yargs 18 runtime has this method)
		const options = yargsInstance.parseSync();

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
			...(typeof options.firstHeaderPageTitle === "boolean"
				? { firstHeadingPageTitle: options.firstHeaderPageTitle }
				: undefined),
		};
	}
}
