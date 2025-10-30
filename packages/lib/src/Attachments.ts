import SparkMD5 from "spark-md5";
import { RequiredConfluenceClient, LoaderAdaptor } from "./adaptors";
import sizeOf from "image-size";

/**
 * Status of an image stored in Confluence.
 */
export type ConfluenceImageStatus = "existing" | "uploaded";

/**
 * Metadata for an image attachment present or uploaded on Confluence.
 */
export interface UploadedImageData {
	filename: string;
	id: string;
	collection: string;
	width: number;
	height: number;
	status: ConfluenceImageStatus;
}

/**
 * Mapping of filename to details on previously uploaded attachments (by filehash).
 */
export type CurrentAttachments = Record<
	string,
	{
		filehash: string;
		attachmentId: string;
		collectionName: string;
	}
>;

/**
 * Uploads a binary buffer to Confluence as an image attachment, deduplicating using MD5.
 *
 * If the image content is already present and matches by hash, no upload occurs.
 *
 * @param confluenceClient Confluence API client.
 * @param pageId Page ID to attach image to.
 * @param uploadFilename Target filename.
 * @param fileBuffer Image buffer (PNG expected).
 * @param currentAttachments Mapping of current attachments for duplicate check.
 * @returns Metadata for the uploaded/new/existing image, or null if no upload.
 * @throws If upload fails.
 */
export async function uploadBuffer(
	confluenceClient: RequiredConfluenceClient,
	pageId: string,
	uploadFilename: string,
	fileBuffer: Buffer,
	currentAttachments: Record<
		string,
		{ filehash: string; attachmentId: string; collectionName: string }
	>,
): Promise<UploadedImageData | null> {
	const spark = new SparkMD5.ArrayBuffer();
	const currentFileMd5 = spark
		.append(
			fileBuffer.buffer.slice(
				fileBuffer.byteOffset,
				fileBuffer.byteOffset + fileBuffer.byteLength,
			) as ArrayBuffer,
		)
		.end();
	const imageSize = await sizeOf(fileBuffer);

	const fileInCurrentAttachments = currentAttachments[uploadFilename];
	if (fileInCurrentAttachments?.filehash === currentFileMd5) {
		return {
			filename: uploadFilename,
			id: fileInCurrentAttachments.attachmentId,
			collection: fileInCurrentAttachments.collectionName,
			width: imageSize.width ?? 0,
			height: imageSize.height ?? 0,
			status: "existing",
		};
	}

	const attachmentDetails = {
		id: pageId,
		attachments: [
			{
				file: fileBuffer,
				filename: uploadFilename,
				minorEdit: false,
				comment: currentFileMd5,
				contentType: "image/png",
			},
		],
	};

	const attachmentResponse =
		await confluenceClient.contentAttachments.createOrUpdateAttachments(
			attachmentDetails,
		);

	const attachmentUploadResponse = attachmentResponse.results[0];
	if (!attachmentUploadResponse) {
		throw new Error("Issue uploading buffer");
	}

	return {
		filename: uploadFilename,
		id: attachmentUploadResponse.extensions.fileId,
		collection: `contentId-${attachmentUploadResponse.container.id}`,
		width: imageSize.width ?? 0,
		height: imageSize.height ?? 0,
		status: "uploaded",
	};
}

/**
 * Read a local file, compute its MD5, and attach it to a Confluence page if not already present.
 *
 * Attempts to read `fileNameToUpload` and, if missing, retries with percent-decoded filename. If an attachment with the same MD5 already exists for the computed upload key, returns the existing attachment metadata; otherwise uploads the file and returns the uploaded metadata.
 *
 * @param confluenceClient - Confluence API client used to create or update attachments.
 * @param adaptor - Loader adaptor used to read the file contents.
 * @param pageId - Confluence page ID to attach the file to.
 * @param pageFilePath - File path context for resolving the file via the adaptor.
 * @param fileNameToUpload - Filename to upload (may be percent-encoded); the function will retry with decodeURI if the initial read fails.
 * @param currentAttachments - Mapping of existing attachments keyed by computed upload filename (used for MD5-based deduplication).
 * @returns Metadata for the existing or newly uploaded image, or `null` if the file cannot be read.
 * @throws If the Confluence upload response does not contain an expected result.
 */
export async function uploadFile(
	confluenceClient: RequiredConfluenceClient,
	adaptor: LoaderAdaptor,
	pageId: string,
	pageFilePath: string,
	fileNameToUpload: string,
	currentAttachments: CurrentAttachments,
): Promise<UploadedImageData | null> {
	let fileNameForUpload = fileNameToUpload;
	let testing = await adaptor.readBinary(fileNameForUpload, pageFilePath);
	if (!testing) {
		fileNameForUpload = decodeURI(fileNameForUpload);
		testing = await adaptor.readBinary(fileNameForUpload, pageFilePath);
	}
	if (testing) {
		const spark = new SparkMD5.ArrayBuffer();
		const currentFileMd5 = spark.append(testing.contents).end();
		const pathMd5 = SparkMD5.hash(testing.filePath);
		const uploadFilename = `${pathMd5}-${testing.filename}`;
		const imageBuffer = Buffer.from(testing.contents);
		const imageSize = await sizeOf(imageBuffer);

		const fileInCurrentAttachments = currentAttachments[uploadFilename];
		if (fileInCurrentAttachments?.filehash === currentFileMd5) {
			return {
				filename: fileNameForUpload,
				id: fileInCurrentAttachments.attachmentId,
				collection: fileInCurrentAttachments.collectionName,
				width: imageSize.width ?? 0,
				height: imageSize.height ?? 0,
				status: "existing",
			};
		}

		const attachmentDetails = {
			id: pageId,
			attachments: [
				{
					file: imageBuffer,
					filename: uploadFilename,
					minorEdit: false,
					comment: currentFileMd5,
				},
			],
		};

		const attachmentResponse =
			await confluenceClient.contentAttachments.createOrUpdateAttachments(
				attachmentDetails,
			);

		const attachmentUploadResponse = attachmentResponse.results[0];
		if (!attachmentUploadResponse) {
			throw new Error("Issue uploading image");
		}

		return {
			filename: fileNameForUpload,
			id: attachmentUploadResponse.extensions.fileId,
			collection: `contentId-${attachmentUploadResponse.container.id}`,
			width: imageSize.width ?? 0,
			height: imageSize.height ?? 0,
			status: "uploaded",
		};
	}

	return null;
}