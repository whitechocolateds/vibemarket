import { promises as fs } from 'fs';
import path from 'path';
import { isBlobStorageEnabled, readJsonFromBlob, writeJsonToBlob } from './blobStore';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function ensureDataDir() {
  if (isBlobStorageEnabled()) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  if (isBlobStorageEnabled()) {
    try {
      const stored = await readJsonFromBlob<T>(filename);
      return stored ?? fallback;
    } catch (error) {
      console.error(`Blob read failed for ${filename}:`, error);
      return fallback;
    }
  }

  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  if (isBlobStorageEnabled()) {
    await writeJsonToBlob(filename, data);
    return;
  }

  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
