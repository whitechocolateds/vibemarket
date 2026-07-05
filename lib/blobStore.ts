import { get, put } from '@vercel/blob';

const BLOB_PREFIX = 'store';

function blobPathname(filename: string): string {
  return `${BLOB_PREFIX}/${filename}`;
}

export function isBlobStorageEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readJsonFromBlob<T>(filename: string): Promise<T | null> {
  const result = await get(blobPathname(filename), { access: 'private' });
  if (!result || result.statusCode !== 200 || !result.stream) return null;

  const text = await new Response(result.stream).text();
  return JSON.parse(text) as T;
}

export async function writeJsonToBlob<T>(filename: string, data: T): Promise<void> {
  await put(blobPathname(filename), JSON.stringify(data, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
}
