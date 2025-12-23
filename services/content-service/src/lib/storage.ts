import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

let blobServiceClient: BlobServiceClient;
let containerClient: ContainerClient;

export function initializeStorage() {
  blobServiceClient = BlobServiceClient.fromConnectionString(config.storage.connectionString);
  containerClient = blobServiceClient.getContainerClient(config.storage.containerName);
}

export async function ensureContainerExists() {
  await containerClient.createIfNotExists({
    access: 'blob',
  });
}

export function generateBlobName(originalFilename: string, folder?: string): string {
  const ext = originalFilename.split('.').pop() || '';
  const uuid = uuidv4();
  const blobName = `${uuid}.${ext}`;
  return folder ? `${folder}/${blobName}` : blobName;
}

export async function uploadBlob(
  blobName: string,
  data: Buffer,
  contentType: string
): Promise<{ url: string; cdnUrl?: string }> {
  const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(data, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: 'public, max-age=31536000',
    },
  });

  const url = blockBlobClient.url;
  const cdnUrl = config.storage.cdnEndpoint
    ? `${config.storage.cdnEndpoint}/${config.storage.containerName}/${blobName}`
    : undefined;

  return { url, cdnUrl };
}

export async function uploadStream(
  blobName: string,
  stream: NodeJS.ReadableStream,
  contentLength: number,
  contentType: string
): Promise<{ url: string; cdnUrl?: string }> {
  const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadStream(stream as any, undefined, undefined, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: 'public, max-age=31536000',
    },
  });

  const url = blockBlobClient.url;
  const cdnUrl = config.storage.cdnEndpoint
    ? `${config.storage.cdnEndpoint}/${config.storage.containerName}/${blobName}`
    : undefined;

  return { url, cdnUrl };
}

export async function deleteBlob(blobName: string): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

export async function getBlobUrl(blobName: string): Promise<string> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  return blockBlobClient.url;
}

export async function generateSasUrl(blobName: string, expiresInMinutes: number = 60): Promise<string> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const expiresOn = new Date();
  expiresOn.setMinutes(expiresOn.getMinutes() + expiresInMinutes);

  const sasUrl = await blockBlobClient.generateSasUrl({
    permissions: { read: true } as never,
    expiresOn,
  });

  return sasUrl;
}

export { containerClient, blobServiceClient };
