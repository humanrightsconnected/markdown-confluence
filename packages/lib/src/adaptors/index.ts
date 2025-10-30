import { Api } from "confluence.js";
import { ConfluencePerPageAllValues } from "../ConniePageConfig";

/**
 * Collection of types and interfaces for filesystem/loader adaptors.
 *
 * Adaptors abstract file I/O and Confluence client interactions for publish flows.
 */
export type FilesToUpload = Array<MarkdownFile>;

/**
 * Representation of a Markdown file discovered by an adaptor.
 */
export interface MarkdownFile {
	folderName: string;
	absoluteFilePath: string;
	fileName: string;
	contents: string;
	pageTitle: string;
	frontmatter: {
		[key: string]: unknown;
	};
}

/**
 * Binary file loaded by an adaptor used for attachment uploads.
 */
export interface BinaryFile {
	filename: string;
	filePath: string;
	mimeType: string;
	contents: ArrayBuffer;
}

/**
 * Abstraction for reading/updating markdown files and binary assets.
 */
export interface LoaderAdaptor {
	updateMarkdownValues(
		absoluteFilePath: string,
		values: Partial<ConfluencePerPageAllValues>,
	): Promise<void>;
	loadMarkdownFile(absoluteFilePath: string): Promise<MarkdownFile>;
	getMarkdownFilesToUpload(): Promise<FilesToUpload>;
	readBinary(
		path: string,
		referencedFromFilePath: string,
	): Promise<BinaryFile | false>;
}

/**
 * Narrow client interface required by the library for Confluence operations.
 */
export interface RequiredConfluenceClient {
	content: Api.Content;
	space: Api.Space;
	contentAttachments: Api.ContentAttachments;
	contentLabels: Api.ContentLabels;
	users: Api.Users;
}

export * from "./filesystem";
