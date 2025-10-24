import { ConfluenceSettings, DEFAULT_SETTINGS } from "../Settings";
import { SettingsLoader } from "./SettingsLoader";

/**
 * Loads default Confluence settings.
 *
 * This loader provides the baseline default settings defined in DEFAULT_SETTINGS.
 * It is typically the first loader in a chain, with other loaders overriding
 * these defaults with more specific configuration.
 */
export class DefaultSettingsLoader extends SettingsLoader {
	/**
	 * Loads the default Confluence settings.
	 *
	 * @returns The DEFAULT_SETTINGS object containing baseline configuration values
	 */
	loadPartial(): Partial<ConfluenceSettings> {
		return DEFAULT_SETTINGS;
	}
}
