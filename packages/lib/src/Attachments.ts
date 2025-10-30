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
 * Reads a file from disk, computes its hash, and uploads to Confluence as an attachment.
 *
 * If the file is unchanged and already attached, a new upload is skipped. Handles filenames with percent encoding.
 *
 * @param confluenceClient Confluence API client.
 * @param adaptor Adaptor for reading local files.
 * @param pageId Page ID to attach file to.
 * @param pageFilePath Path to the page the attachment relates to.
 * @param fileNameToUpload Filename to upload (relative).
 * @param currentAttachments Attachments already present in Confluence.
 * @returns Metadata for the uploaded/existing file, or null if not found.
 * @throws If reading or uploading the file fails.
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
