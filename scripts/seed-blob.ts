import { MOCK_PRODUCTS } from '../lib/mockData';
import { isBlobStorageEnabled, readJsonFromBlob, writeJsonToBlob } from '../lib/blobStore';

async function main() {
  if (!isBlobStorageEnabled()) {
    console.error('BLOB_READ_WRITE_TOKEN nije postavljen.');
    process.exit(1);
  }

  const existingProducts = await readJsonFromBlob<unknown[]>('products.json');
  if (existingProducts && existingProducts.length > 0) {
    console.log(`Blob vec sadrzi ${existingProducts.length} proizvoda — preskacem products.json`);
  } else {
    await writeJsonToBlob('products.json', MOCK_PRODUCTS);
    console.log(`Ucitano ${MOCK_PRODUCTS.length} proizvoda u Blob (store/products.json)`);
  }

  const existingOrders = await readJsonFromBlob<unknown[]>('orders.json');
  if (existingOrders) {
    console.log(`Blob vec sadrzi orders.json (${existingOrders.length} porudzbina)`);
  } else {
    await writeJsonToBlob('orders.json', []);
    console.log('Kreiran prazan orders.json u Blob');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
