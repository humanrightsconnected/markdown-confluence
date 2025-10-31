import { ImageUploaderPlugin } from "./ImageUploaderPlugin";

/**
 * Built-in ADF processing plugins and public exports.
 */

export * from "./types";
export * from "./MermaidRendererPlugin";

/**
 * Plugins that are always applied during publishing.
 */
export const AlwaysADFProcessingPlugins = [ImageUploaderPlugin];
