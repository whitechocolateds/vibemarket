const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY nije definisan u .env.local fajlu.');
  }

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

  const res = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API Error (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Nema odgovora od Gemini AI.');
  }

  return text;
}

export interface GeneratedProduct {
  title: string;
  description: string;
  vendor: string;
  price: number;
  compareAtPrice?: number;
  tags: string[];
  features: string[];
  comparisonPoints: { us: string; competitor: string }[];
  faqs: { question: string; answer: string }[];
}

export async function generateProductWithAI(prompt: string): Promise<GeneratedProduct> {
  const systemInstruction = `Si stručnjak za e-commerce i pisanje vrhunskih prodajnih opisa za proizvode na srpskom jeziku za e-commerce prodavnicu VibeMarket. 
Tvoj zadatak je da na osnovu naziva ili kratkog opisa proizvoda generišeš potpun JSON objekat sa prodajnim naslovom, bogatim opisom, brendom (vendor), sugerisanom cenom u RSD, tagovima, ključnim prednostima, poređenjem sa konkurencijom i često postavljanim pitanjima (FAQ).

VRAĆAJ ISKLJUČIVO SVOJ ODGOVOR KAO ČIST JSON BEZ MARKDOWN CODE BLOCK-OVA KAKO BI SE MOGAO PARSIRATI DIREKTNO SA JSON.parse(). Format mora biti tačno sledeći:
{
  "title": "Zvučan i privlačan naziv proizvoda",
  "description": "Bogat prodajni tekst u 2-3 pasusa sa naglaskom na kvalitet i brzu dostavu.",
  "vendor": "VibeMarket ili naziv brenda",
  "price": 3990,
  "compareAtPrice": 5990,
  "tags": ["bestseller", "novo", "elektronika"],
  "features": ["Prednost 1 sa detaljem", "Prednost 2 sa detaljem", "Prednost 3"],
  "comparisonPoints": [
    {"us": "Prednost našeg proizvoda 1", "competitor": "Mana jeftine konkurencije 1"},
    {"us": "Prednost našeg proizvoda 2", "competitor": "Mana jeftine konkurencije 2"}
  ],
  "faqs": [
    {"question": "Da li je proizvod originalan?", "answer": "Da, 100% garancija kvaliteta sa garancijom 2 godine."},
    {"question": "Koliko traje dostava?", "answer": "Dostava je 1-3 radna dana, plaćanje pouzećem."}
  ]
}`;

  const responseText = await callGemini(`Generiši kompletne podatke o proizvodu za: "${prompt}"`, systemInstruction);
  
  // Clean potential ```json prefix
  const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(cleanJson) as GeneratedProduct;
}

export async function generateCustomerMessageAI(order: any): Promise<string> {
  const systemInstruction = `Ti si profesionalni AI asistent za podršku kupcima prodavnice VibeMarket. Napiši toplu, profesionalnu i jasnu SMS ili Email poruku kupcu povodom njegove porudžbine na srpskom jeziku.`;
  const prompt = `Napiši poruku za kupca ${order.customerInfo?.firstName ?? 'kupca'} za porudžbinu #${order.orderNumber}. Status porudžbine je "${order.status}". Ukupan iznos je ${order.totalPrice} RSD. Plaćanje je pouzećem pri preuzimanju.`;
  
  return await callGemini(prompt, systemInstruction);
}

export async function generateSalesInsightsAI(stats: any): Promise<string> {
  const systemInstruction = `Ti si vrhunski AI E-commerce Analitičar za e-commerce prodavnicu VibeMarket. Na osnovu datih statističkih podataka generiši kratak, koncizan i izuzetno koristan izveštaj sa 3 ključna saveta kako povećati prodaju i prihode. Pisi na srpskom jeziku sa lepo uuređenim stavkama.`;
  const prompt = `Evo statistike prodavnice: Ukupan prihod: ${stats.totalRevenue} RSD, Ukupno porudžbina: ${stats.totalOrders}, Porudžbine na čekanju: ${stats.pendingOrders}, Prihod danas: ${stats.todayRevenue} RSD, Broj proizvoda: ${stats.totalProducts}. Daj mi analizu i 3 konkretna saveta za povećanje konverzija.`;

  return await callGemini(prompt, systemInstruction);
}
