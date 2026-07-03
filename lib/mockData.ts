import { Product, Collection } from './types';

// ─── Seed podaci (inicijalni katalog) ───────────────────────────────────────

export const MOCK_COLLECTIONS: Collection[] = [
  { id: 'col-1', handle: 'elektronika', title: 'Elektronika' },
  { id: 'col-2', handle: 'odeća', title: 'Odeća' },
  { id: 'col-3', handle: 'kucni-aparati', title: 'Kućni aparati' },
  { id: 'col-4', handle: 'sport', title: 'Sport i fitnes' },
  { id: 'col-5', handle: 'kozmetika', title: 'Kozmetika' },
  { id: 'col-6', handle: 'igracke', title: 'Igračke' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-9',
    handle: 'kibla-za-led-mega',
    title: 'Kibla za led h24cm MEGA (pakovanje od 10 komada)',
    description:
      'Kibla za led h24cm MEGA (prečnik 19 cm) – kvalitetna, prostrana i praktična posuda za led idealna za domaćinstvo, ugostitelje i događaje. Pakovanje od 10 komada u raznim bojama.',
    descriptionHtml: `<p>Kibla za led h24cm MEGA predstavlja praktičan, moderan i izuzetno funkcionalan dodatak svakom domu, ugostiteljskom objektu, kancelariji ili event prostoru. Dizajnirana je tako da omogući dugotrajno hlađenje kockica leda i pravilno čuvanje temperature pića.</p>
<h3>Osnovne karakteristike</h3>
<ul>
<li><strong>Visina:</strong> 24 cm</li>
<li><strong>Prečnik:</strong> 19 cm</li>
<li><strong>Pakovanje:</strong> 10 komada (razne boje, boje se ne biraju)</li>
<li><strong>Materijal:</strong> kvalitetna, izdržljiva plastika</li>
<li><strong>Proizvođač:</strong> Megaplast, Srbija</li>
</ul>
<p>Izrađena je od plastike koja ne zadržava mirise, lako se čisti i otporna je na hladnoću - led sporije topi i ostaje svež duže vreme. Lagana je, jednostavna za prenošenje i stabilna za korišćenje na stolovima, šankovima ili napolju.</p>
<h3>Idealna za</h3>
<ul>
<li>Rođendanske proslave, slave i porodična okupljanja</li>
<li>Kafiće, restorane, barove i cateringe</li>
<li>Posluživanje vina, šampanjca i koktela</li>
<li>Letnje žurke, terase i vikendice</li>
</ul>`,
    featuredImage: {
      url: 'https://plastikaonline.rs/wp-content/uploads/2022/09/Kibla-za-led-MEGA-plava-600x532.jpg',
      altText: 'Kibla za led h24cm MEGA – plava',
    },
    images: [
      {
        url: 'https://plastikaonline.rs/wp-content/uploads/2022/09/Kibla-za-led-MEGA-plava-600x532.jpg',
        altText: 'Kibla za led MEGA – plava',
      },
      {
        url: 'https://plastikaonline.rs/wp-content/uploads/2022/09/Kibla-za-led-h24cm-MEGA-600x600.jpg',
        altText: 'Kibla za led h24cm MEGA',
      },
      {
        url: 'https://plastikaonline.rs/wp-content/uploads/2022/09/Kibla-za-led-MEGA-bela-600x584.jpg',
        altText: 'Kibla za led MEGA – bela',
      },
      {
        url: 'https://plastikaonline.rs/wp-content/uploads/2022/09/Kibla-za-led-MEGA-mix-600x400.jpg',
        altText: 'Kibla za led MEGA – mix boja u pakovanju',
      },
    ],
    variants: [{
      id: 'var-9-1',
      title: 'Pakovanje 10 kom',
      price: { amount: '3800', currencyCode: 'RSD' },
      compareAtPrice: null,
      availableForSale: true,
      quantityAvailable: 50,
      selectedOptions: [{ name: 'Pakovanje', value: '10 komada' }],
    }],
    priceRange: {
      minVariantPrice: { amount: '3800', currencyCode: 'RSD' },
      maxVariantPrice: { amount: '3800', currencyCode: 'RSD' },
    },
    tags: ['kuhinja', 'ugostiteljstvo', 'novo', 'kibla-za-led'],
    vendor: 'Megaplast, Srbija',
    productType: 'Kuhinja',
    availableForSale: true,
  },
  {
    id: 'prod-1',
    handle: 'bežične-slušalice-pro',
    title: 'Bežične Slušalice Pro',
    description: 'Premium bežične slušalice sa aktivnim poništavanjem buke. Baterija traje do 30 sati. Idealne za rad od kuće i putovanje.',
    descriptionHtml: '<p>Premium bežične slušalice sa <strong>aktivnim poništavanjem buke</strong>. Baterija traje do 30 sati. Idealne za rad od kuće i putovanje.</p>',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      altText: 'Bežične slušalice Pro',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', altText: 'Bežične slušalice' },
      { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80', altText: 'Slušalice detalj' },
    ],
    variants: [{
      id: 'var-1-1', title: 'Default', price: { amount: '4990', currencyCode: 'RSD' },
      compareAtPrice: { amount: '7990', currencyCode: 'RSD' },
      availableForSale: true, quantityAvailable: 15,
      selectedOptions: [{ name: 'Title', value: 'Default' }],
    }],
    priceRange: { minVariantPrice: { amount: '4990', currencyCode: 'RSD' }, maxVariantPrice: { amount: '4990', currencyCode: 'RSD' } },
    tags: ['elektronika', 'audio', 'bestseller'],
    vendor: 'VibeMarket',
    productType: 'Elektronika',
    availableForSale: true,
  },
  {
    id: 'prod-2',
    handle: 'pametni-sat-sport',
    title: 'Pametni Sat Sport X5',
    description: 'Sportski pametni sat sa GPS-om, merenjem pulsa i vodonepropusnošću do 50m. Savršen za trčanje i plivanje.',
    descriptionHtml: '<p>Sportski pametni sat sa <strong>GPS-om</strong>, merenjem pulsa i vodonepropusnošću do 50m.</p>',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
      altText: 'Pametni sat Sport X5',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80', altText: 'Pametni sat' },
    ],
    variants: [{
      id: 'var-2-1', title: 'Crna', price: { amount: '8990', currencyCode: 'RSD' },
      compareAtPrice: null,
      availableForSale: true, quantityAvailable: 8,
      selectedOptions: [{ name: 'Boja', value: 'Crna' }],
    }, {
      id: 'var-2-2', title: 'Srebrna', price: { amount: '8990', currencyCode: 'RSD' },
      compareAtPrice: null,
      availableForSale: true, quantityAvailable: 5,
      selectedOptions: [{ name: 'Boja', value: 'Srebrna' }],
    }],
    priceRange: { minVariantPrice: { amount: '8990', currencyCode: 'RSD' }, maxVariantPrice: { amount: '8990', currencyCode: 'RSD' } },
    tags: ['sport', 'pametni-sat', 'novo'],
    vendor: 'VibeMarket',
    productType: 'Sport',
    availableForSale: true,
  },
  {
    id: 'prod-3',
    handle: 'bluetooth-zvucnik',
    title: 'Bluetooth Zvučnik Boost',
    description: 'Vodootporni Bluetooth zvučnik sa 360° zvukom i baterijom od 20 sati. Idealan za piknik i plažu.',
    descriptionHtml: '<p>Vodootporni Bluetooth zvučnik sa <strong>360° zvukom</strong> i baterijom od 20 sati.</p>',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
      altText: 'Bluetooth zvučnik',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80', altText: 'Zvučnik' },
    ],
    variants: [{
      id: 'var-3-1', title: 'Default', price: { amount: '3490', currencyCode: 'RSD' },
      compareAtPrice: { amount: '4990', currencyCode: 'RSD' },
      availableForSale: true, quantityAvailable: 23,
      selectedOptions: [{ name: 'Title', value: 'Default' }],
    }],
    priceRange: { minVariantPrice: { amount: '3490', currencyCode: 'RSD' }, maxVariantPrice: { amount: '3490', currencyCode: 'RSD' } },
    tags: ['elektronika', 'audio'],
    vendor: 'VibeMarket',
    productType: 'Elektronika',
    availableForSale: true,
  },
  {
    id: 'prod-4',
    handle: 'laptop-stend',
    title: 'Ergonomski Laptop Stend',
    description: 'Aluminijumski laptop stend sa podesivim visinom i uglom. Poboljšava držanje i smanjuje bol u vratu.',
    descriptionHtml: '<p>Aluminijumski laptop stend sa podesivim visinom i uglom.</p>',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80',
      altText: 'Laptop stend',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80', altText: 'Laptop stend' },
    ],
    variants: [{
      id: 'var-4-1', title: 'Default', price: { amount: '2990', currencyCode: 'RSD' },
      compareAtPrice: null,
      availableForSale: true, quantityAvailable: 31,
      selectedOptions: [{ name: 'Title', value: 'Default' }],
    }],
    priceRange: { minVariantPrice: { amount: '2990', currencyCode: 'RSD' }, maxVariantPrice: { amount: '2990', currencyCode: 'RSD' } },
    tags: ['kancelarija', 'laptop'],
    vendor: 'VibeMarket',
    productType: 'Kancelarija',
    availableForSale: true,
  },
  {
    id: 'prod-5',
    handle: 'fitnes-narukvica',
    title: 'Fitnes Narukvica Ultra',
    description: 'Fitnes narukvica sa praćenjem sna, aktivnosti i stresa. Baterija 7 dana, AMOLED ekran.',
    descriptionHtml: '<p>Fitnes narukvica sa praćenjem sna, aktivnosti i stresa.</p>',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=80',
      altText: 'Fitnes narukvica',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=80', altText: 'Narukvica' },
    ],
    variants: [{
      id: 'var-5-1', title: 'Crna', price: { amount: '2490', currencyCode: 'RSD' },
      compareAtPrice: { amount: '3990', currencyCode: 'RSD' },
      availableForSale: true, quantityAvailable: 42,
      selectedOptions: [{ name: 'Boja', value: 'Crna' }],
    }],
    priceRange: { minVariantPrice: { amount: '2490', currencyCode: 'RSD' }, maxVariantPrice: { amount: '2490', currencyCode: 'RSD' } },
    tags: ['sport', 'fitnes', 'bestseller'],
    vendor: 'VibeMarket',
    productType: 'Sport',
    availableForSale: true,
  },
  {
    id: 'prod-6',
    handle: 'wireless-punjač',
    title: 'Wireless Punjač 15W',
    description: 'Brzi bežični punjač kompatibilan sa svim Qi uređajima. Punjenje 15W za iPhone i 10W za Android.',
    descriptionHtml: '<p>Brzi bežični punjač kompatibilan sa svim Qi uređajima.</p>',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80',
      altText: 'Wireless punjač',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80', altText: 'Punjač' },
    ],
    variants: [{
      id: 'var-6-1', title: 'Default', price: { amount: '1990', currencyCode: 'RSD' },
      compareAtPrice: null,
      availableForSale: true, quantityAvailable: 67,
      selectedOptions: [{ name: 'Title', value: 'Default' }],
    }],
    priceRange: { minVariantPrice: { amount: '1990', currencyCode: 'RSD' }, maxVariantPrice: { amount: '1990', currencyCode: 'RSD' } },
    tags: ['elektronika', 'punjač'],
    vendor: 'VibeMarket',
    productType: 'Elektronika',
    availableForSale: true,
  },
  {
    id: 'prod-7',
    handle: 'mehanička-tastatura',
    title: 'Mehanička Gaming Tastatura',
    description: 'RGB mehanička tastatura sa Cherry MX Red tasterima. Idealna za gaming i brzo kucanje.',
    descriptionHtml: '<p>RGB mehanička tastatura sa <strong>Cherry MX Red</strong> tasterima.</p>',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
      altText: 'Mehanička tastatura',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80', altText: 'Tastatura' },
    ],
    variants: [{
      id: 'var-7-1', title: 'Default', price: { amount: '5990', currencyCode: 'RSD' },
      compareAtPrice: { amount: '8990', currencyCode: 'RSD' },
      availableForSale: true, quantityAvailable: 12,
      selectedOptions: [{ name: 'Title', value: 'Default' }],
    }],
    priceRange: { minVariantPrice: { amount: '5990', currencyCode: 'RSD' }, maxVariantPrice: { amount: '5990', currencyCode: 'RSD' } },
    tags: ['gaming', 'tastatura', 'novo'],
    vendor: 'VibeMarket',
    productType: 'Elektronika',
    availableForSale: true,
  },
  {
    id: 'prod-8',
    handle: 'web-kamera-4k',
    title: 'Web Kamera 4K Ultra HD',
    description: '4K web kamera sa autofokusom i redukcijom buke mikrofona. Savršena za video pozive i streaming.',
    descriptionHtml: '<p>4K web kamera sa autofokusom i redukcijom buke mikrofona.</p>',
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&q=80',
      altText: 'Web kamera 4K',
    },
    images: [
      { url: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&q=80', altText: 'Kamera' },
    ],
    variants: [{
      id: 'var-8-1', title: 'Default', price: { amount: '6990', currencyCode: 'RSD' },
      compareAtPrice: null,
      availableForSale: true, quantityAvailable: 9,
      selectedOptions: [{ name: 'Title', value: 'Default' }],
    }],
    priceRange: { minVariantPrice: { amount: '6990', currencyCode: 'RSD' }, maxVariantPrice: { amount: '6990', currencyCode: 'RSD' } },
    tags: ['elektronika', 'kamera', 'streaming'],
    vendor: 'VibeMarket',
    productType: 'Elektronika',
    availableForSale: true,
  },
];
