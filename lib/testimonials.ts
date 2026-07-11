export interface Testimonial {
  quote: string;
  name: string;
  city: string;
  time: string;
  likes: number;
  /** Opciona fotografija priložena uz recenziju (npr. slika kupljenog proizvoda) */
  image?: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: 'Poručila sam u ponedeljak, paket stigao u sredu - tačno kako piše. Kvalitet proizvoda daleko iznad očekivanog. Svaka preporuka! 😍',
    name: 'Milica R.',
    city: 'Beograd',
    time: '3 d',
    likes: 42,
  },
  {
    quote: 'Konačno prodavnica koja ne obećava lažno. Plaćanje pouzećem mi daje sigurnost, a podrška odgovara isti dan. 👏',
    name: 'Nikola T.',
    city: 'Novi Sad',
    time: '5 d',
    likes: 28,
  },
  {
    quote: 'Ništa nije nasumično - svaki proizvod deluje promišljeno, ne kao gomila slučajnih artikala.',
    name: 'Jovana M.',
    city: 'Niš',
    time: '1 ned',
    likes: 17,
  },
  {
    quote: 'Naručio sam popodne, kurir je zvao već sutradan ujutru. Ambalaža uredna, proizvod tačno kao na slici. 📦',
    name: 'Stefan P.',
    city: 'Kragujevac',
    time: '1 ned',
    likes: 35,
  },
  {
    quote: 'Prijatno iznenađenje - očekivala sam običnu prodavnicu, a dobila sam pažnju do detalja i brz odgovor podrške.',
    name: 'Ana V.',
    city: 'Subotica',
    time: '2 ned',
    likes: 21,
  },
  {
    quote: 'Vraćam se redovno. Cene su poštene, dostava tačna, a asortiman se stalno osvežava novim stvarima. 🔥',
    name: 'Marko D.',
    city: 'Novi Pazar',
    time: '3 ned',
    likes: 53,
  },
];

function stableHash(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

/** Vraća listu recenzija u redosledu koji zavisi od seed-a (npr. handle proizvoda), radi raznovrsnosti po stranicama. */
export function pickTestimonials(seed: string): Testimonial[] {
  const offset = stableHash(seed) % TESTIMONIALS.length;
  return [...TESTIMONIALS.slice(offset), ...TESTIMONIALS.slice(0, offset)];
}
