/**
 * Type-safe wrapper for yargs parseSync method.
 * Yargs 18 includes parseSync but some transitive dependencies provide
 * outdated @types/yargs that lack this method definition.
 */
export interface YargsWithParseSync<T> {
	parseSync(): T;
}
