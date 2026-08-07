const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ─── Priority fallback queue ──────────────────────────────────────────────────
export const VALID_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

export async function listAvailableGeminiModels(): Promise<{ name: string; displayName: string }[]> {
  if (!GEMINI_API_KEY) return [];
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );
    if (!res.ok) return VALID_MODELS.map((m) => ({ name: m, displayName: m }));
    const json = await res.json();
    if (!json.models) return VALID_MODELS.map((m) => ({ name: m, displayName: m }));
    return json.models
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => ({
        name: m.name.replace(/^models\//, ''),
        displayName: m.displayName || m.name,
      }));
  } catch {
    return VALID_MODELS.map((m) => ({ name: m, displayName: m }));
  }
}

// ─── Core Gemini caller (with optional Google Search grounding) ───────────────
export async function callGemini(
  prompt: string,
  systemInstruction?: string,
  preferredModel?: string,
  useGoogleSearch = false
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY nije definisan u .env.local fajlu.');
  }

  const modelQueue =
    preferredModel && preferredModel !== 'auto'
      ? [preferredModel, ...VALID_MODELS.filter((m) => m !== preferredModel)]
      : VALID_MODELS;

  let lastError: Error | null = null;

  for (const model of modelQueue) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      const payload: any = {
        contents: [{ parts: [{ text: prompt }] }],
      };

      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      // Enable Google Search grounding if requested
      if (useGoogleSearch) {
        payload.tools = [{ google_search: {} }];
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Model ${model} vratio ${res.status}: ${errorText}. Pokušavam sledeći...`);
        lastError = new Error(`Model ${model} (status ${res.status}): ${errorText}`);
        continue;
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err: any) {
      console.warn(`Izuzetak pri pozivu ${model}: ${err.message}. Pokušavam sledeći...`);
      lastError = err;
    }
  }

  throw lastError || new Error('Nijedan dostupan Gemini AI model nije uspeo da vrati odgovor.');
}

// ─── Unsplash dynamic image search ───────────────────────────────────────────
async function fetchUnsplashImage(query: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const photo = json.results?.[0];
    if (!photo) return null;
    return `${photo.urls.raw}&w=800&auto=format&fit=crop&q=80`;
  } catch {
    return null;
  }
}

// Fallback: Unsplash Source URL — no API key needed, random image for query
function unsplashSourceUrl(query: string): string {
  const encoded = encodeURIComponent(query.replace(/\s+/g, ','));
  // Use a stable Unsplash collection URL format with search-like keywords
  return `https://images.unsplash.com/photo-1614632537190-23e4146777db?w=800&auto=format&fit=crop&q=80`;
}

// Static curated fallbacks per category
const CATEGORY_IMAGES: Record<string, string> = {
  fudbal: 'https://images.unsplash.com/photo-1614632537190-23e4146777db?w=800&auto=format&fit=crop&q=80',
  lopta: 'https://images.unsplash.com/photo-1614632537190-23e4146777db?w=800&auto=format&fit=crop&q=80',
  sport: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
  trcanje: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80',
  zvucnik: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
  slusalice: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  sat: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  pametan: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  tastatura: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
  mis: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
  laptop: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop&q=80',
  telefon: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
  lampa: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
  kuhinja: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
  blender: 'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=800&auto=format&fit=crop&q=80',
  masaza: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&auto=format&fit=crop&q=80',
  punjac: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80',
  torba: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
  ruksak: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
  nakit: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
  parfem: 'https://images.unsplash.com/photo-1543484977-3b4aa0562f7f?w=800&auto=format&fit=crop&q=80',
  elektronika: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&auto=format&fit=crop&q=80',
};

function pickCuratedImage(title: string, tags: string[], imageQuery: string): string {
  const haystack = [title, imageQuery, ...tags].join(' ').toLowerCase();
  for (const [keyword, url] of Object.entries(CATEGORY_IMAGES)) {
    if (haystack.includes(keyword)) return url;
  }
  return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80';
}

// ─── Product AI Generation ────────────────────────────────────────────────────
export interface GeneratedProduct {
  title: string;
  description: string;
  /** Strukturiran HTML (<p>/<h3>/<strong>/<ul>/<li>) kad ga izvor može dati; inače se izvodi iz `description`. */
  descriptionHtml?: string;
  vendor: string;
  productType: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  imageUrls?: string[];
  imageSearchQuery?: string;
  tags: string[];
  features: string[];
  comparisonPoints: string[];
  faqs: { question: string; answer: string }[];
}

export async function generateProductWithAI(
  prompt: string,
  selectedModel?: string
): Promise<GeneratedProduct> {
  // Detect current date for context
  const now = new Date();
  const currentDate = now.toLocaleDateString('sr-RS', { year: 'numeric', month: 'long', day: 'numeric' });
  const currentYear = now.getFullYear();

  const systemInstruction = `Ti si stručnjak za e-commerce i prodajne opise za srpsku prodavnicu VibeMarket.
Danas je ${currentDate} (${currentYear}. godina). Koristi Google pretragu da pronađeš AKTUALNE i TAČNE informacije o proizvodu koji treba da opišeš — ovo je OBAVEZNO za sve sportske artikle, lopte i sezonske proizvode.

Na osnovu naziva ili kratkog opisa proizvoda generiši potpun JSON objekat.

POSEBNO VAŽNO:
- Ako korisnik pomene "poslednje/posednjeg" ili "aktuelno" takmičenje, šampionat, sezon — OBAVEZNO putem Google pretrage sazna koje je to i koristi TAČAN naziv.
- Za sve sportske lopte (fudbal, košarka, odbojka itd.) — sazna koji je zvanični model koji se trenutno koristi na takmičenjima.
- Za "imageSearchQuery" generiši preciznu englesku frazu za pretragu slike koja savršeno opisuje fizički izgled proizvoda (ne brendove, ne logotipe).

VRAĆAJ ISKLJUČIVO ČIST JSON BEZ MARKDOWN (bez \`\`\`json) koji se može parsirati sa JSON.parse():
{
  "title": "Tačan i privlačan naziv na srpskom",
  "description": "Bogat prodajni tekst u 2-3 pasusa koji TAČNO opisuje ovaj konkretan model/verziju.",
  "vendor": "VibeMarket",
  "productType": "Kategorija (npr. Sport, Elektronika, Kućni Aparati)",
  "price": 3990,
  "compareAtPrice": 5990,
  "imageSearchQuery": "official match ball soccer close-up studio photo",
  "tags": ["bestseller", "novo", "sport"],
  "features": ["Tačna karakteristika 1", "Tačna karakteristika 2", "Tačna karakteristika 3"],
  "comparisonPoints": [
    "Original naspram jeftinih replika",
    "Brza dostava 1-3 radna dana",
    "Plaćanje pouzećem"
  ],
  "faqs": [
    {"question": "Da li je lopta originalna?", "answer": "Da, 100% original sa garancijom."},
    {"question": "Koliko traje dostava?", "answer": "1-3 radna dana, plaćanje pouzećem."}
  ]
}`;

  const responseText = await callGemini(
    `Koristeći Google pretragu za aktuelne podatke, generiši kompletne podatke o proizvodu za: "${prompt}"`,
    systemInstruction,
    selectedModel,
    true // useGoogleSearch = true
  );

  // Strip markdown if model still wraps in code blocks
  const cleanJson = responseText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/m, '')
    .trim();

  let parsed: GeneratedProduct;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    // Try to extract JSON object from text
    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini nije vratio validan JSON. Pokušajte ponovo.');
    parsed = JSON.parse(match[0]);
  }

  // Resolve image: 1) Unsplash API, 2) curated fallback by category
  const imageQuery = parsed.imageSearchQuery || `${parsed.title} product photo`;
  const unsplashImg = await fetchUnsplashImage(imageQuery);
  parsed.imageUrl = unsplashImg || pickCuratedImage(parsed.title, parsed.tags || [], imageQuery);

  return parsed;
}

// ─── Customer Message AI ──────────────────────────────────────────────────────
export async function generateCustomerMessageAI(order: any, selectedModel?: string): Promise<string> {
  const sys = `Ti si profesionalni AI asistent za podršku kupcima prodavnice VibeMarket. Napiši toplu, profesionalnu i jasnu SMS ili Email poruku kupcu u srpskom jeziku.`;
  const prompt = `Napiši poruku za kupca ${order.customerInfo?.firstName ?? 'kupca'} za porudžbinu #${order.orderNumber}. Status: "${order.status}". Iznos: ${order.totalPrice} RSD. Plaćanje pouzećem.`;
  return await callGemini(prompt, sys, selectedModel, false);
}

// ─── Sales Insights AI ───────────────────────────────────────────────────────
export async function generateSalesInsightsAI(stats: any, selectedModel?: string): Promise<string> {
  const sys = `Ti si vrhunski AI E-commerce Analitičar za prodavnicu VibeMarket. Na osnovu datih statistika generiši kratak izveštaj sa 3 konkretna saveta kako povećati prodaju. Piši na srpskom.`;
  const prompt = `Statistika prodavnice: Prihod: ${stats.totalRevenue} RSD, Porudžbine: ${stats.totalOrders}, Na čekanju: ${stats.pendingOrders}, Danas: ${stats.todayRevenue} RSD, Proizvodi: ${stats.totalProducts}. Daj analizu i savete.`;
  return await callGemini(prompt, sys, selectedModel, false);
}
