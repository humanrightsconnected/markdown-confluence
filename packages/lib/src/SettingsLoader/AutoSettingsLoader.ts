import { ConfluenceSettings, DEFAULT_SETTINGS } from "../Settings";
import { DefaultSettingsLoader } from "./DefaultSettingsLoader";
import { EnvironmentVariableSettingsLoader } from "./EnvironmentVariableSettingsLoader";
import { ConfigFileSettingsLoader } from "./ConfigFileSettingsLoader";
import { CommandLineArgumentSettingsLoader } from "./CommandLineArgumentSettingsLoader";
import { SettingsLoader } from "./SettingsLoader";

/**
 * Automatically loads and combines Confluence settings from multiple sources.
 *
 * This loader orchestrates multiple settings loaders in a specific order of precedence:
 * 1. DefaultSettingsLoader - provides baseline defaults
 * 2. ConfigFileSettingsLoader - loads from .markdown-confluence.json
 * 3. EnvironmentVariableSettingsLoader - loads from environment variables
 * 4. CommandLineArgumentSettingsLoader - loads from command-line arguments
 *
 * Later loaders override settings from earlier loaders, allowing for flexible
 * configuration hierarchies (e.g., command-line args override environment variables).
 */
export class AutoSettingsLoader extends SettingsLoader {
	/**
	 * Creates a new AutoSettingsLoader instance.
	 *
	 * @param loaders - Optional array of custom loaders. If not provided or empty,
	 *                  uses the default set of loaders in the standard precedence order.
	 */
	constructor(private loaders: SettingsLoader[] = []) {
		super();

		if (loaders.length === 0) {
			this.loaders.push(new DefaultSettingsLoader());
			this.loaders.push(new ConfigFileSettingsLoader());
			this.loaders.push(new EnvironmentVariableSettingsLoader());
			this.loaders.push(new CommandLineArgumentSettingsLoader());
		}
	}

	/**
	 * Combines settings from all configured loaders.
	 *
	 * Iterates through all loaders in order, merging their settings. Later loaders
	 * override values from earlier loaders. Only includes settings with values that
	 * match the expected type from DEFAULT_SETTINGS.
	 *
	 * @returns Combined partial ConfluenceSettings from all loaders
	 * @private
	 */
	private combineSettings(): Partial<ConfluenceSettings> {
		let settings: Partial<ConfluenceSettings> = {};

		for (const loader of this.loaders) {
			const partialSettings = loader.loadPartial();
			const keys = Object.keys(
				partialSettings,
			) as (keyof ConfluenceSettings)[];

			for (const propertyKey of keys) {
				const element = partialSettings[propertyKey];
				if (
					element !== undefined &&
					typeof element === typeof DEFAULT_SETTINGS[propertyKey]
				) {
					settings = {
						...settings,
						[propertyKey]: element,
					};
				}
			}
		}

		return settings;
	}

	/**
	 * Loads partial Confluence settings by combining all configured loaders.
	 *
	 * @returns Combined partial ConfluenceSettings from all loaders
	 */
	loadPartial(): Partial<ConfluenceSettings> {
		return this.combineSettings();
	}
}
