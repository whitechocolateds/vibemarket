import { get, put } from '@vercel/blob';

const BLOB_PREFIX = 'store';

function blobPathname(filename: string): string {
  return `${BLOB_PREFIX}/${filename}`;
}

function blobCommandOptions() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;

  return {
    access: 'private' as const,
    ...(token ? { token } : {}),
    ...(storeId ? { storeId } : {}),
  };
}

export function isBlobStorageEnabled(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token?.startsWith('vercel_blob_rw_')) return true;
  if (process.env.BLOB_STORE_ID?.startsWith('store_')) return true;
  return false;
}

export async function readJsonFromBlob<T>(filename: string): Promise<T | null> {
  try {
    const result = await get(blobPathname(filename), blobCommandOptions());
    if (!result || result.statusCode !== 200 || !result.stream) return null;

    const text = await new Response(result.stream).text();
    return JSON.parse(text) as T;
  } catch (error) {
    console.error(`Blob read failed for ${filename}:`, error);
    return null;
  }
}

export async function writeJsonToBlob<T>(filename: string, data: T): Promise<void> {
  await put(blobPathname(filename), JSON.stringify(data, null, 2), {
    ...blobCommandOptions(),
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
  });
}
