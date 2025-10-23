import { ConfluenceSettings } from "../Settings";
import { SettingsLoader } from "./SettingsLoader";

/**
 * Loads Confluence settings from a static, pre-configured object.
 *
 * This loader is useful for programmatic configuration, testing, or when
 * settings are determined at runtime and need to be injected directly.
 * The settings are provided at construction time and returned as-is.
 */
export class StaticSettingsLoader extends SettingsLoader {
	/**
	 * Creates a new StaticSettingsLoader with the provided settings.
	 *
	 * @param settings - The partial Confluence settings to use
	 */
	constructor(private settings: Partial<ConfluenceSettings>) {
		super();
	}

	/**
	 * Loads the static Confluence settings provided at construction.
	 *
	 * @returns The partial ConfluenceSettings object provided to the constructor
	 */
	loadPartial(): Partial<ConfluenceSettings> {
		return this.settings;
	}
}
