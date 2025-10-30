import esbuild from "esbuild";
import process from "process";
import { writeFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import { baseConfig, isProd } from '../../esbuild.base.config.mjs';

const mermaidRendererPlugin = {
	name: 'mermaidRendererPlugin',
	setup(build) {
		build.onEnd(async () => {
			const result = await esbuild.build({
				entryPoints: ['src/mermaid_renderer.js'],
				bundle: true,
				format: 'cjs',
				platform: 'browser',
				target: 'chrome106',
				logLevel: 'info',
				sourcemap: false,
				treeShaking: true,
				write: false,
				mainFields: ['browser', 'module', 'main'],
				minify: true,
				define: {
					'process.env.NODE_ENV': '"production"',
				},
			}).catch(() => process.exit(1));

			const fileContents = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Mermaid Chart</title>
  </head>
  <body>
  	<div id="graphDiv"></div>
    <script type="text/javascript">
	${result.outputFiles[0].text}
	</script>
  </body>
</html>
			`;

			writeFile("./dist/mermaid_renderer.html", fileContents);
		});
	}
};

const buildConfig = {
	...baseConfig,
	entryPoints: ['src/index.ts'],
	format: 'esm',
	target: 'node16',
	platform: 'node',
	sourcemap: true,
	treeShaking: false,
	outdir: 'dist',
	plugins: [mermaidRendererPlugin, nodeExternalsPlugin()],
	minify: false,
};

if (isProd) {
	const buildResult = await esbuild.build(buildConfig);
	writeFileSync("./dist/meta.json", JSON.stringify(buildResult.metafile));
} else {
	const context = await esbuild.context(buildConfig);
	await context.watch();
}