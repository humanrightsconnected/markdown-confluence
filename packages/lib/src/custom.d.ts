declare module "*.txt" {
	const content: string;
	export default content;
}

declare module "*.json" {
	const content: unknown;
	export default content;
}

declare module "mermaid_renderer.esbuild" {
	const content: Buffer;
	export default content;
}

declare module "sort-any" {
	export default function sortAny<T>(item: T): T;
}

/*
 * Namespace 'React' has no exported member 'StatelessComponent'
 * in formik, react-mapbox-gl
 */
declare namespace React {
	type StatelessComponent<P> = React.FunctionComponent<P>;
}
