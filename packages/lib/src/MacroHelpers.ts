/**
 * Helper functions for generating Confluence macro ADF JSON
 * These can be used programmatically or as reference for embedding macros
 */

export interface MacroParams {
	[key: string]: { value: string };
}

export interface MacroExtension {
	type: "extension" | "inlineExtension";
	attrs: {
		extensionType: string;
		extensionKey: string;
		parameters: {
			macroParams: MacroParams;
			macroMetadata?: {
				macroId?: { value: string };
				schemaVersion?: { value: string };
				title?: string;
			};
		};
		localId?: string;
	};
}

/**
 * Generate a Table of Contents (TOC) macro
 * @param options - TOC configuration options
 * @returns ADF JSON for TOC macro
 */
export function createTocMacro(
	options: {
		printable?: boolean;
		maxLevel?: number;
		minLevel?: number;
		outline?: boolean;
		style?: "default" | "none" | "disc" | "circle" | "square";
		indent?: string;
		separator?: "brackets" | "braces" | "parens" | "pipe" | "space";
	} = {},
): MacroExtension {
	const macroParams: MacroParams = {};

	if (options.printable !== undefined) {
		macroParams.printable = { value: String(options.printable) };
	}
	if (options.maxLevel !== undefined) {
		macroParams.maxLevel = { value: String(options.maxLevel) };
	}
	if (options.minLevel !== undefined) {
		macroParams.minLevel = { value: String(options.minLevel) };
	}
	if (options.outline !== undefined) {
		macroParams.outline = { value: String(options.outline) };
	}
	if (options.style) {
		macroParams.style = { value: options.style };
	}
	if (options.indent) {
		macroParams.indent = { value: options.indent };
	}
	if (options.separator) {
		macroParams.separator = { value: options.separator };
	}

	return {
		type: "extension",
		attrs: {
			extensionType: "com.atlassian.confluence.macro.core",
			extensionKey: "toc",
			parameters: {
				macroParams,
			},
		},
	};
}

/**
 * Generate an Info panel macro
 * @param title - Panel title
 * @returns ADF JSON for info panel
 */
export function createInfoMacro(title = "Info"): MacroExtension {
	return {
		type: "extension",
		attrs: {
			extensionType: "com.atlassian.confluence.macro.core",
			extensionKey: "info",
			parameters: {
				macroParams: {
					title: { value: title },
				},
			},
		},
	};
}

/**
 * Generate a Warning panel macro
 * @param title - Panel title
 * @returns ADF JSON for warning panel
 */
export function createWarningMacro(title = "Warning"): MacroExtension {
	return {
		type: "extension",
		attrs: {
			extensionType: "com.atlassian.confluence.macro.core",
			extensionKey: "warning",
			parameters: {
				macroParams: {
					title: { value: title },
				},
			},
		},
	};
}

/**
 * Generate a Note panel macro
 * @param title - Panel title
 * @returns ADF JSON for note panel
 */
export function createNoteMacro(title = "Note"): MacroExtension {
	return {
		type: "extension",
		attrs: {
			extensionType: "com.atlassian.confluence.macro.core",
			extensionKey: "note",
			parameters: {
				macroParams: {
					title: { value: title },
				},
			},
		},
	};
}

/**
 * Generate a Page Tree macro
 * @param options - Page tree configuration
 * @returns ADF JSON for page tree macro
 */
export function createPageTreeMacro(
	options: {
		root?: string;
		startDepth?: number;
		sort?: "natural" | "creation" | "modified" | "alphabetical" | "reverse";
		searchBox?: boolean;
		expandedDepth?: number;
	} = {},
): MacroExtension {
	const macroParams: MacroParams = {
		root: { value: options.root || "@self" },
		startDepth: { value: String(options.startDepth ?? 1) },
		sort: { value: options.sort || "natural" },
		searchBox: { value: String(options.searchBox ?? true) },
	};

	if (options.expandedDepth !== undefined) {
		macroParams.expandedDepth = { value: String(options.expandedDepth) };
	}

	return {
		type: "inlineExtension",
		attrs: {
			extensionType: "com.atlassian.confluence.macro.core",
			extensionKey: "pagetree",
			parameters: {
				macroParams,
			},
		},
	};
}

/**
 * Generate an Expand macro
 * @param title - Expand section title
 * @returns ADF JSON for expand macro
 */
export function createExpandMacro(title = "Click to expand"): MacroExtension {
	return {
		type: "extension",
		attrs: {
			extensionType: "com.atlassian.confluence.macro.core",
			extensionKey: "expand",
			parameters: {
				macroParams: {
					title: { value: title },
				},
			},
		},
	};
}

/**
 * Generate a Code Block macro with syntax highlighting
 * @param options - Code block configuration
 * @returns ADF JSON for code macro
 */
export function createCodeMacro(
	options: {
		language?: string;
		title?: string;
		linenumbers?: boolean;
		theme?: "Default" | "RDark" | "FadeToGrey" | "Midnight" | "Emacs";
		collapse?: boolean;
	} = {},
): MacroExtension {
	const macroParams: MacroParams = {};

	if (options.language) {
		macroParams.language = { value: options.language };
	}
	if (options.title) {
		macroParams.title = { value: options.title };
	}
	if (options.linenumbers !== undefined) {
		macroParams.linenumbers = { value: String(options.linenumbers) };
	}
	if (options.theme) {
		macroParams.theme = { value: options.theme };
	}
	if (options.collapse !== undefined) {
		macroParams.collapse = { value: String(options.collapse) };
	}

	return {
		type: "extension",
		attrs: {
			extensionType: "com.atlassian.confluence.macro.core",
			extensionKey: "code",
			parameters: {
				macroParams,
			},
		},
	};
}

/**
 * Generate a custom macro
 * @param extensionKey - The macro key (e.g., "toc", "info", etc.)
 * @param params - Macro parameters
 * @param inline - Whether to use inlineExtension (default: false)
 * @returns ADF JSON for custom macro
 */
export function createCustomMacro(
	extensionKey: string,
	params: MacroParams = {},
	inline = false,
): MacroExtension {
	return {
		type: inline ? "inlineExtension" : "extension",
		attrs: {
			extensionType: "com.atlassian.confluence.macro.core",
			extensionKey,
			parameters: {
				macroParams: params,
			},
		},
	};
}

// Export all helper functions
export const MacroHelpers = {
	createTocMacro,
	createInfoMacro,
	createWarningMacro,
	createNoteMacro,
	createPageTreeMacro,
	createExpandMacro,
	createCodeMacro,
	createCustomMacro,
};
