import { mkdir, access, writeFile } from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const ordersFile = path.join(dataDir, 'orders.json');
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

async function fileExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

await mkdir(dataDir, { recursive: true });
await mkdir(uploadsDir, { recursive: true });

if (!(await fileExists(ordersFile))) {
  await writeFile(ordersFile, '[]\n', 'utf-8');
  console.log('Kreiran data/orders.json');
}

console.log('Prodavnica spremna. Proizvodi se ucitavaju pri prvom zahtevu.');
