import { JSONDocNode } from "@atlaskit/editor-json-transformer";
import { AlwaysADFProcessingPlugins } from "./ADFProcessingPlugins";
import {
	ADFProcessingPlugin,
	createPublisherFunctions,
	executeADFProcessingPipeline,
} from "./ADFProcessingPlugins/types";
import { adfEqual } from "./AdfEqual";
import { CurrentAttachments } from "./Attachments";
import { PageContentType } from "./ConniePageConfig";
import { SettingsLoader } from "./SettingsLoader";
import { ensureAllFilesExistInConfluence } from "./TreeConfluence";
import { createFolderStructure as createLocalAdfTree } from "./TreeLocal";
import { LoaderAdaptor, RequiredConfluenceClient } from "./adaptors";
import { isEqual } from "./isEqual";

export interface LocalAdfFileTreeNode {
	name: string;
	children: LocalAdfFileTreeNode[];
	file?: LocalAdfFile;
}

interface FilePublishResult {
	successfulUploadResult?: UploadAdfFileResult;
	node: ConfluenceNode;
	reason?: string;
}

export interface LocalAdfFile {
	folderName: string;
	absoluteFilePath: string;
	fileName: string;
	contents: JSONDocNode;
	pageTitle: string;
	frontmatter: {
		[key: string]: unknown;
	};
	tags: string[];
	pageId: string | undefined;
	dontChangeParentPageId: boolean;
	contentType: PageContentType;
	blogPostDate: string | undefined;
}

export interface ConfluenceAdfFile {
	folderName: string;
	absoluteFilePath: string;
	fileName: string;
	contents: JSONDocNode;
	pageTitle: string;
	frontmatter: {
		[key: string]: unknown;
	};
	tags: string[];
	dontChangeParentPageId: boolean;

	pageId: string;
	spaceKey: string;
	pageUrl: string;

	contentType: PageContentType;
	blogPostDate: string | undefined;
}

interface ConfluencePageExistingData {
	adfContent: JSONDocNode;
	pageTitle: string;
	ancestors: { id: string }[];
	contentType: string;
}

export interface ConfluenceNode {
	file: ConfluenceAdfFile;
	version: number;
	lastUpdatedBy: string;
	existingPageData: ConfluencePageExistingData;
	ancestors: string[];
}

export interface ConfluenceTreeNode {
	file: ConfluenceAdfFile;
	version: number;
	lastUpdatedBy: string;
	existingPageData: ConfluencePageExistingData;
	children: ConfluenceTreeNode[];
}

export interface UploadAdfFileResult {
	adfFile: ConfluenceAdfFile;
	contentResult: "same" | "updated";
	imageResult: "same" | "updated";
	labelResult: "same" | "updated";
}

/**
 * Publisher orchestrates conversion and upload of Markdown-derived ADF content to Confluence.
 *
 * Responsibilities:
 * - Load settings and discover local Markdown files
 * - Ensure pages exist/upsert structure in Confluence
 * - Run ADF processing plugins, update content, attachments, and labels
 *
 * Use `publish()` to perform a full sync, optionally constrained to a single file via `publishFilter`.
 */
export class Publisher {
	private confluenceClient: RequiredConfluenceClient;
	private adaptor: LoaderAdaptor;
	private myAccountId: string | undefined;
	private settingsLoader: SettingsLoader;
	private adfProcessingPlugins: ADFProcessingPlugin<unknown, unknown>[];

	/**
	 * Create a new Publisher.
	 * @param adaptor Abstraction over local I/O and helpers for reading Markdown files.
	 * @param settingsLoader Provider for Confluence and conversion settings.
	 * @param confluenceClient Minimal Confluence client API used for content, users, labels, and attachments.
	 * @param adfProcessingPlugins Pipeline plugins applied to ADF before upload (Always-appended with built-ins).
	 */
	constructor(
		adaptor: LoaderAdaptor,
		settingsLoader: SettingsLoader,
		confluenceClient: RequiredConfluenceClient,
		adfProcessingPlugins: ADFProcessingPlugin<unknown, unknown>[],
	) {
		this.adaptor = adaptor;
		this.settingsLoader = settingsLoader;

		this.confluenceClient = confluenceClient;
		this.adfProcessingPlugins = adfProcessingPlugins.concat(
			AlwaysADFProcessingPlugins,
		);
	}

	/**
	 * Discover files, ensure Confluence structure, and update pages, attachments, and labels.
	 * @param publishFilter Optional absolute file path to limit publishing to a single file.
	 * @returns Results for each processed file indicating whether content/images/labels changed.
	 */
	async publish(publishFilter?: string) {
		const settings = this.settingsLoader.load();

		if (!this.myAccountId) {
			const currentUser =
				await this.confluenceClient.users.getCurrentUser();
			this.myAccountId = currentUser.accountId;
		}

		const parentPage = await this.confluenceClient.content.getContentById({
			id: settings.confluenceParentId,
			expand: ["body.atlas_doc_format", "space"],
		});
		if (!parentPage.space) {
			throw new Error("Missing Space Key");
		}

		const spaceToPublishTo = parentPage.space;

		const files = await this.adaptor.getMarkdownFilesToUpload();
		const folderTree = createLocalAdfTree(files, settings);
		let confluencePagesToPublish = await ensureAllFilesExistInConfluence(
			this.confluenceClient,
			this.adaptor,
			folderTree,
			spaceToPublishTo.key,
			parentPage.id,
			parentPage.id,
			settings,
		);

		if (publishFilter) {
			confluencePagesToPublish = confluencePagesToPublish.filter(
				(file) => file.file.absoluteFilePath === publishFilter,
			);
		}

		const adrFileTasks = confluencePagesToPublish.map((file) => {
			return this.publishFile(file);
		});

		const adrFiles = await Promise.all(adrFileTasks);
		return adrFiles;
	}

	/**
	 * Upload a single file node: runs content update and returns a structured result.
	 * @param node The Confluence node representing the local file and remote metadata.
	 */
	private async publishFile(
		node: ConfluenceNode,
	): Promise<FilePublishResult> {
		try {
			const successfulUploadResult = await this.updatePageContent(
				node.ancestors,
				node.version,
				node.existingPageData,
				node.file,
				node.lastUpdatedBy,
			);

			return {
				node,
				successfulUploadResult,
			};
		} catch (e: unknown) {
			if (e instanceof Error) {
				return {
					node,
					reason: e.message,
				};
			}

			// Handle non-Error objects by extracting useful information
			// JSON.stringify() doesn't capture Error properties well due to non-enumerable properties
			return {
				node,
				reason:
					typeof e === "string"
						? e
						: typeof e === "object" && e !== null
							? String(e)
							: "Unknown error",
			};
		}
	}

	/**
	 * Update Confluence content, attachments, and labels for a single page when needed.
	 *
	 * Throws if the page was last updated by another user or if content types are incompatible.
	 *
	 * @param ancestors Ordered list of ancestor page IDs for hierarchy placement (if applicable).
	 * @param pageVersionNumber Current version number of the page.
	 * @param existingPageData Snapshot of the current page ADF and metadata in Confluence.
	 * @param adfFile Target ADF file to upload and its metadata.
	 * @param lastUpdatedBy Account ID of the user who last updated the page.
	 * @returns Summary of what changed for this page.
	 */
	private async updatePageContent(
		ancestors: string[],
		pageVersionNumber: number,
		existingPageData: ConfluencePageExistingData,
		adfFile: ConfluenceAdfFile,
		lastUpdatedBy: string,
	): Promise<UploadAdfFileResult> {
		if (lastUpdatedBy !== this.myAccountId) {
			throw new Error(
				`Page last updated by another user. Won't publish over their changes. MyAccountId: ${this.myAccountId}, Last Updated By: ${lastUpdatedBy}`,
			);
		}
		if (existingPageData.contentType !== adfFile.contentType) {
			throw new Error(
				`Cannot convert between content types. From ${existingPageData.contentType} to ${adfFile.contentType}`,
			);
		}

		const result: UploadAdfFileResult = {
			adfFile,
			contentResult: "same",
			imageResult: "same",
			labelResult: "same",
		};

		const currentUploadedAttachments =
			await this.confluenceClient.contentAttachments.getAttachments({
				id: adfFile.pageId,
			});

		const currentAttachments: CurrentAttachments =
			currentUploadedAttachments.results.reduce((prev, curr) => {
				return {
					...prev,
					[`${curr.title}`]: {
						filehash: curr.metadata.comment,
						attachmentId: curr.extensions.fileId,
						collectionName: curr.extensions.collectionName,
					},
				};
			}, {});

		const supportFunctions = createPublisherFunctions(
			this.confluenceClient,
			this.adaptor,
			adfFile.pageId,
			adfFile.absoluteFilePath,
			currentAttachments,
		);
		const adfToUpload = await executeADFProcessingPipeline(
			this.adfProcessingPlugins,
			adfFile.contents,
			supportFunctions,
		);

		/*
		const imageResult = Object.keys(imageUploadResult.imageMap).reduce(
			(prev, curr) => {
				const value = imageUploadResult.imageMap[curr];
				if (!value) {
					return prev;
				}
				const status = value.status;
				return {
					...prev,
					[status]: (prev[status] ?? 0) + 1,
				};
			},
			{
				existing: 0,
				uploaded: 0,
			} as Record<string, number>
		);
		*/

		/*
		if (!adfEqual(adfFile.contents, imageUploadResult.adf)) {
			result.imageResult =
				(imageResult["uploaded"] ?? 0) > 0 ? "updated" : "same";
		}
		*/

		result.imageResult = "updated";

		const existingPageDetails = {
			title: existingPageData.pageTitle,
			type: existingPageData.contentType,
			...(adfFile.contentType === "blogpost" ||
			adfFile.dontChangeParentPageId
				? {}
				: { ancestors: existingPageData.ancestors }),
		};

		const newPageDetails = {
			title: adfFile.pageTitle,
			type: adfFile.contentType,
			...(adfFile.contentType === "blogpost" ||
			adfFile.dontChangeParentPageId
				? {}
				: {
						ancestors: ancestors.map((ancestor) => ({
							id: ancestor,
						})),
					}),
		};

		if (
			!adfEqual(existingPageData.adfContent, adfToUpload) ||
			!isEqual(existingPageDetails, newPageDetails)
		) {
			result.contentResult = "updated";

			const updateContentDetails = {
				...newPageDetails,
				id: adfFile.pageId,
				version: { number: pageVersionNumber + 1 },
				body: {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					atlas_doc_format: {
						value: JSON.stringify(adfToUpload),
						representation: "atlas_doc_format",
					},
				},
			};
			await this.confluenceClient.content.updateContent(
				updateContentDetails,
			);
		}

		const getLabelsForContent = {
			id: adfFile.pageId,
		};
		const currentLabels =
			await this.confluenceClient.contentLabels.getLabelsForContent(
				getLabelsForContent,
			);

		for (const existingLabel of currentLabels.results) {
			if (!adfFile.tags.includes(existingLabel.label)) {
				result.labelResult = "updated";
				await this.confluenceClient.contentLabels.removeLabelFromContentUsingQueryParameter(
					{
						id: adfFile.pageId,
						name: existingLabel.name,
					},
				);
			}
		}

		const labelsToAdd = [];
		for (const newLabel of adfFile.tags) {
			if (
				currentLabels.results.findIndex(
					(item) => item.label === newLabel,
				) === -1
			) {
				labelsToAdd.push({
					prefix: "global",
					name: newLabel,
				});
			}
		}

		if (labelsToAdd.length > 0) {
			result.labelResult = "updated";
			await this.confluenceClient.contentLabels.addLabelsToContent({
				id: adfFile.pageId,
				body: labelsToAdd,
			});
		}

		return result;
	}
}
