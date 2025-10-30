import esbuild from "esbuild";
import { writeFileSync } from 'fs';
import builtins from 'builtin-modules';
import { copy } from 'esbuild-plugin-copy';
import { baseConfig, isProd } from '../../esbuild.base.config.mjs';

const buildConfig = {
	...baseConfig,
	entryPoints: ['src/index.ts'],
	format: 'cjs',
	target: 'node16',
	platform: 'node',
	sourcemap: true,
	outdir: 'dist',
	minify: true,
	external: [
		...builtins
	],
	plugins: [
		copy({
			// this is equal to process.cwd(), which means we use cwd path as base path to resolve `to` path
			// if not specified, this plugin uses ESBuild.build outdir/outfile options as base path.
			resolveFrom: 'cwd',
			assets: {
				from: ['../mermaid-puppeteer-renderer/dist/mermaid_renderer.html'],
				to: ['./dist/mermaid_renderer.html'],
			},
			watch: true,
		}),
	],
};

if (isProd) {
	const buildResult = await esbuild.build(buildConfig);
	writeFileSync("./dist/meta.json", JSON.stringify(buildResult.metafile));
} else {
	const context = await esbuild.context(buildConfig);
	await context.watch();
}