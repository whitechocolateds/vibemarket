const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Provereni i validni modeli za ovaj API ključ
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
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    if (!res.ok) return VALID_MODELS.map(m => ({ name: m, displayName: m }));
    const json = await res.json();
    if (!json.models) return VALID_MODELS.map(m => ({ name: m, displayName: m }));
    
    return json.models
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => ({
        name: m.name.replace(/^models\//, ''),
        displayName: m.displayName || m.name,
      }));
  } catch {
    return VALID_MODELS.map(m => ({ name: m, displayName: m }));
  }
}

export async function callGemini(prompt: string, systemInstruction?: string, preferredModel?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY nije definisan u .env.local fajlu.');
  }

  // Ako je naveden specifičan model, stavljamo ga na prvo mesto
  const modelQueue = preferredModel && preferredModel !== 'auto'
    ? [preferredModel, ...VALID_MODELS.filter(m => m !== preferredModel)]
    : VALID_MODELS;

  let lastError: Error | null = null;

  for (const model of modelQueue) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const payload: any = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Model ${model} vratio status ${res.status}: ${errorText}. Pokušavam sledeći model...`);
        lastError = new Error(`Model ${model} (status ${res.status}): ${errorText}`);
        continue;
      }

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(`Izuzetak pri pozivu ${model}: ${err.message}. Pokušavam sledeći model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('Nijedan dostupan Gemini AI model nije uspeo da vrati odgovor.');
}

export interface GeneratedProduct {
  title: string;
  description: string;
  vendor: string;
  productType: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  tags: string[];
  features: string[];
  comparisonPoints: string[];
  faqs: { question: string; answer: string }[];
}

const SAMPLE_IMAGES: Record<string, string> = {
  elektronika: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  sat: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  zvucnik: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
  tastatura: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
  sport: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
  fudbal: 'https://images.unsplash.com/photo-1614632537190-23e4146777db?w=800&auto=format&fit=crop&q=80',
  kuhinja: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
  lampa: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80',
};

export async function generateProductWithAI(prompt: string, selectedModel?: string): Promise<GeneratedProduct> {
  const systemInstruction = `Si stručnjak za e-commerce i pisanje vrhunskih prodajnih opisa za proizvode na srpskom jeziku za e-commerce prodavnicu VibeMarket. 
Tvoj zadatak je da na osnovu naziva ili kratkog opisa proizvoda generišeš potpun JSON objekat sa prodajnim naslovom, bogatim opisom, brendom (vendor), sugerisanom cenom u RSD, tagovima, ključnim prednostima, poređenjem sa konkurencijom i često postavljanim pitanjima (FAQ).

VRAĆAJ ISKLJUČIVO SVOJ ODGOVOR KAO ČIST JSON BEZ MARKDOWN CODE BLOCK-OVA KAKO BI SE MOGAO PARSIRATI DIREKTNO SA JSON.parse(). Format mora biti tačno sledeći:
{
  "title": "Zvučan i privlačan naziv proizvoda",
  "description": "Bogat prodajni tekst u 2-3 pasusa sa naglaskom na kvalitet i brzu dostavu.",
  "vendor": "VibeMarket",
  "productType": "Elektronika",
  "price": 3990,
  "compareAtPrice": 5990,
  "tags": ["bestseller", "novo", "elektronika"],
  "features": ["Prednost 1 sa detaljem", "Prednost 2 sa detaljem", "Prednost 3"],
  "comparisonPoints": [
    "Originalni premium kvalitet naspram jeftinih kopija od plastike",
    "Brza dostava u roku od 1-3 radna dana",
    "Plaćanje pouzećem tek nakon provere paketa"
  ],
  "faqs": [
    {"question": "Da li je proizvod originalan?", "answer": "Da, 100% garancija kvaliteta sa garancijom 2 godine."},
    {"question": "Koliko traje dostava?", "answer": "Dostava je 1-3 radna dana, plaćanje pouzećem."}
  ]
}`;

  const responseText = await callGemini(`Generiši kompletne podatke o proizvodu za: "${prompt}"`, systemInstruction, selectedModel);
  
  const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleanJson) as GeneratedProduct;

  const lower = (parsed.title + ' ' + (parsed.tags || []).join(' ')).toLowerCase();
  let img = SAMPLE_IMAGES.default;
  for (const [key, url] of Object.entries(SAMPLE_IMAGES)) {
    if (lower.includes(key)) {
      img = url;
      break;
    }
  }
  parsed.imageUrl = img;

  return parsed;
}

export async function generateCustomerMessageAI(order: any, selectedModel?: string): Promise<string> {
  const systemInstruction = `Ti si profesionalni AI asistent za podršku kupcima prodavnice VibeMarket. Napiši toplu, profesionalnu i jasnu SMS ili Email poruku kupcu povodom njegove porudžbine na srpskom jeziku.`;
  const prompt = `Napiši poruku za kupca ${order.customerInfo?.firstName ?? 'kupca'} za porudžbinu #${order.orderNumber}. Status porudžbine je "${order.status}". Ukupan iznos je ${order.totalPrice} RSD. Plaćanje je pouzećem pri preuzimanju.`;
  
  return await callGemini(prompt, systemInstruction, selectedModel);
}

export async function generateSalesInsightsAI(stats: any, selectedModel?: string): Promise<string> {
  const systemInstruction = `Ti si vrhunski AI E-commerce Analitičar za e-commerce prodavnicu VibeMarket. Na osnovu datih statističkih podataka generiši kratak, koncizan i izuzetno koristan izveštaj sa 3 ključna saveta kako povećati prodaju i prihode. Pisi na srpskom jeziku sa lepo uređenim stavkama.`;
  const prompt = `Evo statistike prodavnice: Ukupan prihod: ${stats.totalRevenue} RSD, Ukupno porudžbina: ${stats.totalOrders}, Porudžbine na čekanju: ${stats.pendingOrders}, Prihod danas: ${stats.todayRevenue} RSD, Broj proizvoda: ${stats.totalProducts}. Daj mi analizu i 3 konkretna saveta za povećanje konverzija.`;

  return await callGemini(prompt, systemInstruction, selectedModel);
}
