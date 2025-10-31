import {
	ConfluenceAdfFile,
	ConfluenceNode,
	ConfluenceTreeNode,
	LocalAdfFile,
	LocalAdfFileTreeNode,
} from "./Publisher";
import { doc, p } from "@atlaskit/adf-utils/builders";
import { RequiredConfluenceClient, LoaderAdaptor } from "./adaptors";
import { JSONDocNode } from "@atlaskit/editor-json-transformer";
import { prepareAdfToUpload } from "./AdfProcessing";

/**
 * Confluence tree synchronization utilities.
 *
 * Builds and synchronizes a Confluence page tree mirroring the local markdown folder tree,
 * ensuring each local node has a corresponding remote page and collecting metadata necessary
 * for publishing updates (version, ancestors, last author, etc.).
 */
import { ConfluenceSettings } from "./Settings";

const blankPageAdf: string = JSON.stringify(doc(p("Page not published yet")));

/**
 * Ensures all files and folders in the local tree exist as Confluence content pages, creating/updating as needed.
 *
 * The returned nodes contain the IDs, versions, and all metadata for each matched or created Confluence page for publishing.
 * The ADF is preprocessed for upload.
 *
 * @param confluenceClient Minimal Confluence client for content/attachments/labels/users
 * @param adaptor Loader for local files and metadata
 * @param node Tree of all files/folders to ensure exist remotely
 * @param spaceKey Target space key
 * @param parentPageId Parent page for this branch
 * @param topPageId Top of tree (used to avoid accidental cross-tree overwrites)
 * @param settings Global Confluence publishing settings
 * @returns Array with all found/created ConfluenceNode objects for upload
 */
export async function ensureAllFilesExistInConfluence(
	confluenceClient: RequiredConfluenceClient,
	adaptor: LoaderAdaptor,
	node: LocalAdfFileTreeNode,
	spaceKey: string,
	parentPageId: string,
	topPageId: string,
	settings: ConfluenceSettings,
): Promise<ConfluenceNode[]> {
	const confluenceNode = await createFileStructureInConfluence(
		settings,
		confluenceClient,
		adaptor,
		node,
		spaceKey,
		parentPageId,
		topPageId,
		false,
	);

	const pages = flattenTree(confluenceNode);

	prepareAdfToUpload(pages, settings);

	return pages;
}

/**
 * Flatten a ConfluenceTreeNode hierarchy into a flat array of ConfluenceNode entries with ancestor context.
 *
 * @param node - The root ConfluenceTreeNode to traverse
 * @param ancestors - Accumulated ancestor page IDs from parent nodes (use an empty array for the top-level call)
 * @returns An array of ConfluenceNode objects where each entry includes its file, version, lastUpdatedBy, existingPageData, and an `ancestors` array of page IDs
 */
function flattenTree(
	node: ConfluenceTreeNode,
	ancestors: string[] = [],
): ConfluenceNode[] {
	const nodes: ConfluenceNode[] = [];
	const { file, version, lastUpdatedBy, existingPageData, children } = node;

	if (ancestors.length > 0) {
		nodes.push({
			file,
			version,
			lastUpdatedBy,
			existingPageData,
			ancestors,
		});
	}

	if (children) {
		children.forEach((child) => {
			nodes.push(...flattenTree(child, [...ancestors, file.pageId]));
		});
	}

	return nodes;
}

/**
 * Ensure the given local node and its descendants exist as Confluence pages and return a tree describing their Confluence state.
 *
 * @param settings - Confluence settings used to build page URLs and other configuration
 * @param confluenceClient - Client used to query, create, and update Confluence content
 * @param adaptor - Loader adaptor used to update local file metadata (e.g., publish status and pageId)
 * @param node - Local file/folder node to create or inspect in Confluence
 * @param spaceKey - Confluence space key where pages should reside
 * @param parentPageId - Confluence page ID to treat as the parent for the current node
 * @param topPageId - Top-level page ID for the tree; used to prevent cross-tree overwrites
 * @param createPage - When true, resolve or create the Confluence page for `node`; when false, initialize defaults for the top-level invocation
 * @returns A ConfluenceTreeNode representing the resolved file (including pageUrl), its version, lastUpdatedBy, child nodes, and existing page data (ADF content, page title, ancestors, and content type)
 * @throws Error if `node.file` is missing
 */
async function createFileStructureInConfluence(
	settings: ConfluenceSettings,
	confluenceClient: RequiredConfluenceClient,
	adaptor: LoaderAdaptor,
	node: LocalAdfFileTreeNode,
	spaceKey: string,
	parentPageId: string,
	topPageId: string,
	createPage: boolean,
): Promise<ConfluenceTreeNode> {
	if (!node.file) {
		throw new Error("Missing file on node");
	}

	let version: number;
	let adfContent: JSONDocNode | undefined;
	let pageTitle = "";
	let contentType = "page";
	let ancestors: { id: string }[] = [];
	let lastUpdatedBy: string | undefined;
	const file: ConfluenceAdfFile = {
		...node.file,
		pageId: parentPageId,
		spaceKey,
		pageUrl: "",
	};

	if (createPage) {
		const pageDetails = await ensurePageExists(
			confluenceClient,
			adaptor,
			node.file,
			spaceKey,
			parentPageId,
			topPageId,
			settings,
		);
		file.pageId = pageDetails.id;
		file.spaceKey = pageDetails.spaceKey;
		version = pageDetails.version;
		adfContent = JSON.parse(pageDetails.existingAdf ?? "{}") as JSONDocNode;
		pageTitle = pageDetails.pageTitle;
		ancestors = pageDetails.ancestors;
		lastUpdatedBy = pageDetails.lastUpdatedBy;
		contentType = pageDetails.contentType;
	} else {
		version = 0;
		adfContent = doc(p());
		pageTitle = "";
		ancestors = [];
		contentType = "page";
	}

	const childDetailsTasks = node.children.map((childNode) => {
		return createFileStructureInConfluence(
			settings,
			confluenceClient,
			adaptor,
			childNode,
			spaceKey,
			file.pageId,
			topPageId,
			true,
		);
	});

	const childDetails = await Promise.all(childDetailsTasks);

	const pageUrl = `${settings.confluenceBaseUrl}/wiki/spaces/${spaceKey}/pages/${file.pageId}/`;
	return {
		file: { ...file, pageUrl },
		version,
		lastUpdatedBy: lastUpdatedBy ?? "",
		children: childDetails,
		existingPageData: {
			adfContent,
			pageTitle,
			ancestors,
			contentType,
		},
	};
}

/**
 * Resolve or create the Confluence page corresponding to a local file and return its identifiers and metadata.
 *
 * Looks up content by `file.pageId` when present; otherwise searches by `spaceKey` and `file.pageTitle`. If no existing page is found, creates a blank page (with `blankPageAdf`) under `parentPageId` when the content type is "page". Updates the loader adaptor's markdown values with `publish` and `pageId` as it discovers or creates the page.
 *
 * @param confluenceClient - Confluence client used to fetch or create content
 * @param adaptor - Loader adaptor used to update local markdown metadata
 * @param file - Local file descriptor; `pageId`, `pageTitle`, and `contentType` influence lookup/creation behavior
 * @param spaceKey - Target Confluence space key to search/create content in
 * @param parentPageId - Ancestor page id to attach newly created pages under (used when creating pages)
 * @param topPageId - The selected top page id; used to prevent overwriting pages outside the selected page tree
 * @returns An object with page details: `id`, `title`, `version`, `lastUpdatedBy`, `existingAdf`, `pageTitle`, `ancestors` (array of `{ id }`), `spaceKey`, and `contentType`
 * @throws Error if an existing page of type "page" is found but none of its ancestors matches `topPageId` (prevents cross-tree overwrite)
 */
async function ensurePageExists(
	confluenceClient: RequiredConfluenceClient,
	adaptor: LoaderAdaptor,
	file: LocalAdfFile,
	spaceKey: string,
	parentPageId: string,
	topPageId: string,
	settings: ConfluenceSettings,
) {
	if (file.pageId) {
		try {
			const contentById = await confluenceClient.content.getContentById({
				id: file.pageId,
				expand: [
					"version",
					"body.atlas_doc_format",
					"ancestors",
					"space",
				],
			});

			let pageSpaceKey = contentById.space?.key;

			if (!pageSpaceKey) {
				// If API didn't return space data, try using configured space key as fallback
				if (settings.confluenceSpaceKey) {
					console.warn(
						`Page ${file.pageId}: Using fallback space key '${settings.confluenceSpaceKey}' (API did not return space data)`,
					);
					pageSpaceKey = settings.confluenceSpaceKey;
				} else {
					throw new Error(
						`Failed to retrieve space key for page ID: ${file.pageId}. ` +
							`The Confluence API did not return space data for this page. ` +
							`Common causes:\n` +
							`  - Invalid or non-existent page ID (${file.pageId})\n` +
							`  - Insufficient permissions to access this page\n` +
							`  - Page may have been deleted or moved\n` +
							`Solutions:\n` +
							`  - Add "confluenceSpaceKey" to your .markdown-confluence.json configuration file\n` +
							`  - Verify the page ID in '${file.absoluteFilePath}' frontmatter is correct\n` +
							`  - Check that you have read access to this page in Confluence\n` +
							`  - Remove the page ID from frontmatter to create a new page instead`,
					);
				}
			}

			await adaptor.updateMarkdownValues(file.absoluteFilePath, {
				publish: true,
				pageId: contentById.id,
			});

			return {
				id: contentById.id,
				title: file.pageTitle,
				version: contentById?.version?.number ?? 1,
				lastUpdatedBy:
					contentById?.version?.by?.accountId ?? "NO ACCOUNT ID",
				existingAdf: contentById?.body?.atlas_doc_format?.value,
				spaceKey: pageSpaceKey,
				pageTitle: contentById.title,
				ancestors:
					contentById.ancestors?.map((ancestor) => ({
						id: ancestor.id,
					})) ?? [],
				contentType: contentById.type,
			} as const;
		} catch (error: unknown) {
			if (
				error instanceof Error &&
				"response" in error &&
				typeof error.response === "object" &&
				error.response &&
				"status" in error.response &&
				typeof error.response.status === "number" &&
				error.response.status === 404
			) {
				await adaptor.updateMarkdownValues(file.absoluteFilePath, {
					publish: false,
					pageId: undefined,
				});
			}

			throw error;
		}
	}

	const searchParams = {
		type: file.contentType,
		spaceKey,
		title: file.pageTitle,
		expand: ["version", "body.atlas_doc_format", "ancestors"],
	};
	const contentByTitle =
		await confluenceClient.content.getContent(searchParams);

	const currentPage = contentByTitle.results[0];

	if (currentPage) {
		if (
			file.contentType === "page" &&
			!currentPage.ancestors?.some((ancestor) => ancestor.id == topPageId)
		) {
			throw new Error(
				`${file.pageTitle} is trying to overwrite a page outside the page tree from the selected top page`,
			);
		}

		await adaptor.updateMarkdownValues(file.absoluteFilePath, {
			publish: true,
			pageId: currentPage.id,
		});
		return {
			id: currentPage.id,
			title: file.pageTitle,
			version: currentPage.version?.number ?? 1,
			lastUpdatedBy:
				currentPage.version?.by?.accountId ?? "NO ACCOUNT ID",
			existingAdf: currentPage.body?.atlas_doc_format?.value,
			pageTitle: currentPage.title,
			spaceKey,
			ancestors:
				currentPage.ancestors?.map((ancestor) => ({
					id: ancestor.id,
				})) ?? [],
			contentType: currentPage.type,
		} as const;
	} else {
		const creatingBlankPageRequest = {
			space: { key: spaceKey },
			...(file.contentType === "page"
				? { ancestors: [{ id: parentPageId }] }
				: {}),
			title: file.pageTitle,
			type: file.contentType,
			body: {
				// eslint-disable-next-line @typescript-eslint/naming-convention
				atlas_doc_format: {
					value: blankPageAdf,
					representation: "atlas_doc_format",
				},
			},
			expand: ["version", "body.atlas_doc_format", "ancestors"],
		};
		const pageDetails = await confluenceClient.content.createContent(
			creatingBlankPageRequest,
		);

		await adaptor.updateMarkdownValues(file.absoluteFilePath, {
			publish: true,
			pageId: pageDetails.id,
		});
		return {
			id: pageDetails.id,
			title: file.pageTitle,
			version: pageDetails.version?.number ?? 1,
			lastUpdatedBy:
				pageDetails.version?.by?.accountId ?? "NO ACCOUNT ID",
			existingAdf: pageDetails.body?.atlas_doc_format?.value,
			pageTitle: pageDetails.title,
			ancestors:
				pageDetails.ancestors?.map((ancestor) => ({
					id: ancestor.id,
				})) ?? [],
			spaceKey,
			contentType: pageDetails.type,
		} as const;
	}
}
