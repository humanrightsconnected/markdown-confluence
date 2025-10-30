import path from "path";
import { MarkdownFile } from "./adaptors";
import { convertMDtoADF } from "./MdToADF";
import { folderFile } from "./FolderFile";
import { JSONDocNode } from "@atlaskit/editor-json-transformer";
import { LocalAdfFileTreeNode } from "./Publisher";

/**
 * Local tree construction utilities for Markdown files destined for Confluence.
 *
 * Transforms a flat list of `MarkdownFile` entries into a hierarchical tree mirroring
 * folders, attaches ADF content and per-page config, and enforces invariants such as
 * unique page titles per node.
 */
import { ConfluenceSettings } from "./Settings";

/**
 * Build a tree of local Markdown and folder structure for publishing to Confluence.
 *
 * Converts a flat Markdown file array into a tree, assigning each file and folder its CORRECT ADF document/node and publishing config.
 * Throws if any page titles are not unique.
 *
 * @param markdownFiles List of files (with metadata and contents)
 * @param settings Global Confluence publishing settings
 * @returns Root tree node representing all files/folders as LocalAdfFileTreeNode
 */
export const createFolderStructure = (
	markdownFiles: MarkdownFile[],
	settings: ConfluenceSettings,
): LocalAdfFileTreeNode => {
	const commonPath = findCommonPath(
		markdownFiles.map((file) => file.absoluteFilePath),
	);
	const rootNode = createTreeNode(commonPath);

	markdownFiles.forEach((file) => {
		const relativePath = path.relative(commonPath, file.absoluteFilePath);
		addFileToTree(rootNode, file, relativePath, settings);
	});

	processNode(commonPath, rootNode);

	checkUniquePageTitle(rootNode);

	return rootNode;
};

/**
 * Internal: finds the common ancestor path for a set of absolute paths.
 */
const findCommonPath = (paths: string[]): string => {
	const [firstPath, ...rest] = paths;
	if (!firstPath) {
		throw new Error("No Paths Provided");
	}
	const commonPathParts = firstPath.split(path.sep);

	rest.forEach((filePath) => {
		const pathParts = filePath.split(path.sep);
		for (let i = 0; i < commonPathParts.length; i++) {
			if (pathParts[i] !== commonPathParts[i]) {
				commonPathParts.splice(i);
				break;
			}
		}
	});

	return commonPathParts.join(path.sep);
};

const createTreeNode = (name: string): LocalAdfFileTreeNode => ({
	name,
	children: [],
});

/**
 * Internal: Inserts a MarkdownFile into the tree at the right path, converting to ADF.
 */
const addFileToTree = (
	treeNode: LocalAdfFileTreeNode,
	file: MarkdownFile,
	relativePath: string,
	settings: ConfluenceSettings,
) => {
	const [folderName, ...remainingPath] = relativePath.split(path.sep);
	if (folderName === undefined) {
		throw new Error("Unable to get folder name");
	}

	if (remainingPath.length === 0) {
		const adfFile = convertMDtoADF(file, settings);
		treeNode.children.push({
			...createTreeNode(folderName),
			file: adfFile,
		});
	} else {
		let childNode = treeNode.children.find(
			(node) => node.name === folderName,
		);

		if (!childNode) {
			childNode = createTreeNode(folderName);
			treeNode.children.push(childNode);
		}

		addFileToTree(childNode, file, remainingPath.join(path.sep), settings);
	}
};

/**
 * Internal: After tree is built, ensure each branch gets its file node and points children correctly.
 */
const processNode = (commonPath: string, node: LocalAdfFileTreeNode) => {
	if (!node.file) {
		let indexFile = node.children.find(
			(child) => path.parse(child.name).name === node.name,
		);
		if (!indexFile) {
			// Support FolderFile with a file name of "index.md"
			indexFile = node.children.find((child) =>
				["index", "README", "readme"].includes(
					path.parse(child.name).name,
				),
			);
		}

		if (indexFile && indexFile.file) {
			node.file = indexFile.file;
			node.children = node.children.filter(
				(child) => child !== indexFile,
			);
		} else {
			node.file = {
				folderName: node.name,
				absoluteFilePath: path.join(commonPath, node.name),
				fileName: `${node.name}.md`,
				contents: folderFile as JSONDocNode,
				pageTitle: node.name,
				frontmatter: {},
				tags: [],
				pageId: undefined,
				dontChangeParentPageId: false,
				contentType: "page",
				blogPostDate: undefined,
			};
		}
	}

	const childCommonPath = path.parse(
		node?.file?.absoluteFilePath ?? commonPath,
	).dir;

	node.children.forEach((childNode) =>
		processNode(childCommonPath, childNode),
	);
};

/**
 * Ensure every node in the tree has a unique page title; aborts on the first duplicate found.
 *
 * @param rootNode - The tree node to validate (root of the subtree to check)
 * @param pageTitles - Internal set of already-seen page titles used while recursing; callers can omit
 * @throws Error if a duplicate page title is encountered
 */
function checkUniquePageTitle(
	rootNode: LocalAdfFileTreeNode,
	pageTitles: Set<string> = new Set<string>(),
) {
	const currentPageTitle = rootNode.file?.pageTitle ?? "";

	if (pageTitles.has(currentPageTitle)) {
		throw new Error(
			`Page title "${currentPageTitle}" is not unique across all files.`,
		);
	}
	pageTitles.add(currentPageTitle);
	rootNode.children.forEach((child) =>
		checkUniquePageTitle(child, pageTitles),
	);
}
