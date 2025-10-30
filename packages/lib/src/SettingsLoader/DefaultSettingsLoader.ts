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
	 * Returns DEFAULT_SETTINGS with contentRoot set to process.cwd() if not already set.
	 * This ensures process.cwd() is evaluated at load time rather than module import time,
	 * providing more predictable behavior in testing environments and when working
	 * directory changes.
	 *
	 * @returns The DEFAULT_SETTINGS object containing baseline configuration values
	 */
	loadPartial(): Partial<ConfluenceSettings> {
		return {
			...DEFAULT_SETTINGS,
			contentRoot: DEFAULT_SETTINGS.contentRoot || process.cwd(),
		};
	}
}
