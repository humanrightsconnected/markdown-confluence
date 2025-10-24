import path from "path";
import { ConfluenceSettings, DEFAULT_SETTINGS } from "../Settings";
import { SettingsLoader } from "./SettingsLoader";
import fs from "fs";
import yargs, { type ArgumentsCamelCase } from "yargs/yargs";
import { hideBin } from "yargs/helpers";

/**
 * Interface for the config option returned by yargs parsing.
 */
interface ConfigOptions {
	config: string;
}

/**
 * Loads Confluence settings from a configuration file.
 *
 * This settings loader reads configuration from a JSON file, with support for:
 * - Custom config file path via constructor parameter
 * - Environment variable CONFLUENCE_CONFIG_FILE
 * - Command-line argument --config or -c
 * - Default path: .markdown-confluence.json in the current working directory
 */
export class ConfigFileSettingsLoader extends SettingsLoader {
	private configPath: string = path.join(
		process.cwd() ?? "",
		".markdown-confluence.json",
	);

	/**
	 * Creates a new ConfigFileSettingsLoader instance.
	 *
	 * The config file path is determined in the following order of precedence:
	 * 1. The configPath parameter if provided
	 * 2. The CONFLUENCE_CONFIG_FILE environment variable if set
	 * 3. The --config/-c command-line argument if provided
	 * 4. The default path (.markdown-confluence.json in the current working directory)
	 *
	 * @param configPath - Optional path to the configuration file
	 */
	constructor(configPath?: string) {
		super();

		if (configPath) {
			this.configPath = configPath;
			return;
		}

		const envConfigPath =
			"CONFLUENCE_CONFIG_FILE" in process.env &&
			process.env["CONFLUENCE_CONFIG_FILE"]
				? process.env["CONFLUENCE_CONFIG_FILE"]
				: undefined;

		if (envConfigPath) {
			this.configPath = envConfigPath;
		}

		const options: ArgumentsCamelCase<ConfigOptions> = yargs(
			hideBin(process.argv),
		)
			.option("config", {
				alias: "c",
				describe: "Path to the config file",
				type: "string",
				default: this.configPath,
				demandOption: false,
			})
			.parseSync();

		// Only use CLI arg if env var was not set and CLI differs from default
		if (!envConfigPath && options.config !== this.configPath) {
			this.configPath = options.config;
		}
	}

	/**
	 * Loads partial Confluence settings from the configuration file.
	 *
	 * Reads the JSON configuration file and extracts settings that match the keys
	 * defined in DEFAULT_SETTINGS. Only non-null/non-undefined values are included
	 * in the result.
	 *
	 * @returns A partial ConfluenceSettings object containing the settings found in
	 *          the config file, or an empty object if the file cannot be read or parsed
	 */
	loadPartial(): Partial<ConfluenceSettings> {
		try {
			const configData = fs.readFileSync(this.configPath, {
				encoding: "utf-8",
			});
			const config = JSON.parse(
				configData,
			) as Partial<ConfluenceSettings>;

			const result: Partial<ConfluenceSettings> = {};

			for (const key in DEFAULT_SETTINGS) {
				if (Object.prototype.hasOwnProperty.call(config, key)) {
					const propertyKey = key as keyof ConfluenceSettings;
					const element = config[propertyKey];
					if (element !== undefined && element !== null) {
						(result as Record<string, unknown>)[propertyKey] =
							element;
					}
				}
			}

			return result;
		} catch {
			return {};
		}
	}
}
