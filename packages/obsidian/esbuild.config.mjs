import esbuild from "esbuild";
import builtins from 'builtin-modules';
import { writeFileSync } from 'fs';
import { baseConfig, isProd } from '../../esbuild.base.config.mjs';

const buildConfig = {
	...baseConfig,
	entryPoints: ['src/main.ts'],
	external: [
		'obsidian',
		'electron',
		'@codemirror/autocomplete',
		'@codemirror/collab',
		'@codemirror/commands',
		'@codemirror/language',
		'@codemirror/lint',
		'@codemirror/search',
		'@codemirror/state',
		'@codemirror/view',
		'@lezer/common',
		'@lezer/highlight',
		'@lezer/lr',
		...builtins
	],
	format: 'cjs',
	target: 'chrome106',
	sourcemap: isProd ? false : 'inline',
	outdir: isProd ? 'dist' : '../../dev-vault/.obsidian/plugins/obsidian-confluence',
	minify: true,
};

if (isProd) {
	const buildResult = await esbuild.build(buildConfig);
	writeFileSync("./dist/meta.json", JSON.stringify(buildResult.metafile));
} else {
	const context = await esbuild.context(buildConfig);
	await context.watch();
}
