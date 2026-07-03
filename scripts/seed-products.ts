import { getAllProducts } from '../lib/productStore';

getAllProducts().then((products) => {
  console.log(`Ucitano ${products.length} proizvoda u data/products.json`);
});
