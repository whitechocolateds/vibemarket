export interface ProductImage {
  url: string;
  altText: string | null;
  width?: number;
  height?: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  } | null;
  availableForSale: boolean;
  quantityAvailable?: number;
  selectedOptions: {
    name: string;
    value: string;
  }[];
  /** Shopify variant id - slanje porudzbina ga koristi da skine zalihu na pravom artiklu. */
  shopifyVariantId?: number;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  featuredImage: ProductImage | null;
  images: ProductImage[];
  variants: ProductVariant[];
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  tags: string[];
  vendor: string;
  productType: string;
  availableForSale: boolean;
  collections?: Collection[];
  /** Zašto baš ovaj proizvod - specifično za njega, prikazano u tabeli poređenja na strani proizvoda */
  comparisonPoints?: string[];
  /** Pitanja i odgovori specifični za ovaj proizvod */
  faqs?: ProductFaq[];
  /** Poreklo sa Shopify-ja; postoji samo na uvezenim proizvodima. Bez njega se
   *  porudzbina ne moze vezati za pravi artikal nego ide kao slobodna stavka. */
  shopifyProductId?: number;
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description?: string;
  image?: ProductImage | null;
}

export interface CartItem {
  id: string; // variantId
  productId: string;
  handle: string;
  title: string;
  variantTitle: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  image: ProductImage | null;
  shopifyVariantId?: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface OrderForm {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  note?: string;
  paymentMethod: 'pouzeće';
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: CartItem[];
  customerInfo: OrderForm;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  label: string; // dd.MM
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  title: string;
  handle: string;
  image: string | null;
  quantity: number;
  revenue: number;
}

export interface LowStockProduct {
  id: string;
  title: string;
  handle: string;
  image: string | null;
  quantity: number;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  todayOrders: number;
  yesterdayRevenue: number;
  yesterdayOrders: number;
  totalProducts: number;
  activeProducts: number;
  avgOrderValue: number;
  itemsSold: number;
  lowStockCount: number;
  statusCounts: Record<Order['status'], number>;
  revenueByDay: DailyStat[];
  topProducts: TopProduct[];
  lowStockProducts: LowStockProduct[];
  recentOrders: Order[];
}

/** Podaci o izvoru pri uvozu sa konkurentskog linka - prikazuju se kao kontekst uz formu. */
export interface ImportSourceMeta {
  sourceUrl: string;
  platform: string;
  /** Cena kod konkurenta, u NJIHOVOJ valuti. Nikad se ne konvertuje automatski. */
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  images: string[];
}

export interface ProductInput {
  title: string;
  handle?: string;
  description: string;
  descriptionHtml?: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl: string;
  imageUrls?: string[];
  tags: string[];
  vendor: string;
  productType: string;
  quantity: number;
  availableForSale: boolean;
  comparisonPoints?: string[];
  faqs?: ProductFaq[];
  shopifyProductId?: number;
  shopifyVariantId?: number;
}

