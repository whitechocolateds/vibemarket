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
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface OrderForm {
  firstName: string;
  lastName: string;
  email: string;
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

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  todayOrders: number;
  totalProducts: number;
  recentOrders: Order[];
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
}

export interface ShopifyCheckoutInput {
  lineItems: {
    variantId: string;
    quantity: number;
  }[];
  customAttributes?: {
    key: string;
    value: string;
  }[];
  note?: string;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    zip: string;
    phone: string;
    country: string;
  };
}
