'use client';

import { useState } from 'react';
import { ExternalLink, LayoutTemplate, Sparkles } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import {
  LANDING_THEMES, DEFAULT_LANDING_THEME, landingTheme,
  benefitsToStr, parseBenefits, statsToStr, parseStats,
  objectionsToStr, parseObjections, type LandingPage,
} from '@/lib/landing';
import type { LandingContext } from '@/lib/gemini';
import styles from '@/app/admin/admin.module.css';

interface Props {
  value?: LandingPage;
  /**
   * Handle SACUVANOG proizvoda; bez njega nema linka za pregled.
   * Namerno se ne koristi slug iz forme - dok se ne sacuva, ta adresa ne postoji.
   */
  handle?: string;
  /** Tekuci sadrzaj forme; AI pise landing iz njega, ne iz sacuvanog proizvoda. */
  context?: LandingContext;
  /**
   * setState potpis, ne obicna funkcija.
   *
   * Nuzno je da bude funkcionalni oblik: otpremanja se zavrsavaju paralelno i
   * minutima posle pokretanja, pa ono koje se zavrsi mora da se nadoveze na
   * TEKUCE stanje. Sa `(next: LandingPage) => void` je svaki poziv nosio kopiju
   * zamrznutu pri iscrtavanju i vracao ostala polja unazad.
   */
  onChange: React.Dispatch<React.SetStateAction<LandingPage | undefined>>;
  disabled?: boolean;
}

const PRAZAN: LandingPage = { enabled: false, theme: DEFAULT_LANDING_THEME.id };

/**
 * ImageUploader ocekuje setState potpis (funkcionalni update mu je nuzan jer se
 * otpremanja zavrsavaju paralelno), a ovde cuvamo jednu sliku kao string.
 * Adapter prevodi jedno u drugo i uzima poslednju otpremljenu.
 */
function jednaSlika(trenutna: string | undefined, primeni: (url: string) => void) {
  return (akcija: React.SetStateAction<string[]>) => {
    const pre = trenutna ? [trenutna] : [];
    const posle = typeof akcija === 'function' ? akcija(pre) : akcija;
    primeni(posle[posle.length - 1] ?? '');
  };
}

/**
 * Polje sa redovima oblika "a | b": PRIKAZUJE sirov tekst, a roditelju salje
 * parsirano.
 *
 * Ranije je polje bilo vezano pravo za parsiranje - `value={statsToStr(...)}`,
 * `onChange={... parseStats(...)}` - pa je svaki otkucaj isao u krug
 * tekst -> niz -> tekst i u polje se vracao REZULTAT tog kruga. Posto parser
 * sece razmake, izbacuje prazne redove i odbacuje red bez opisa, tekst se umeo
 * skratiti za ceo red odjednom (izmereno: 13 znakova kad se isprazni opis
 * treceg reda). Kursor bi ostao na staroj brojcanoj poziciji, zavrsio izvan
 * kraja teksta i pretrazivac bi ga spustio u prvi red - pa bi dalje brisanje
 * jelo prvi red. Razmak se nije mogao otkucati, Enter nije pravio nov red.
 *
 * Sada se tekst drzi ovde kakav jeste, a parsira se usput za roditelja, bez
 * vracanja u polje.
 */
function usePoljeRedova<T>(
  spoljniNiz: T[] | undefined,
  uTekst: (v?: T[]) => string,
  uNiz: (s: string) => T[],
  primeni: (v: T[]) => void
): [string, (s: string) => void] {
  const spoljniTekst = uTekst(spoljniNiz);
  const [tekst, setTekst] = useState(spoljniTekst);
  const [posledjiSpoljni, setPoslednjiSpoljni] = useState(spoljniTekst);

  /*
   * Osvezavanje kad podaci stignu SPOLJA: AI ponovo generise landing, otvori se
   * drugi proizvod, vrati se nacrt. Bez ovoga bi polje pokazivalo stari tekst.
   *
   * Ali ne i kad je promena posledica mog kucanja - tada bi se sirov tekst
   * prepisao normalizovanim i kursor bi opet skakao. Zato se poredi sa onim sto
   * BI moj tekst dao kroz parser: ako je isto, promenu sam izazvao ja.
   *
   * Postavljanje stanja tokom iscrtavanja je obrazac koji React predvidja bas
   * za uskladjivanje sa promenjenim propom - iscrtava ponovo odmah, bez treptaja.
   */
  if (spoljniTekst !== posledjiSpoljni) {
    setPoslednjiSpoljni(spoljniTekst);
    if (spoljniTekst !== uTekst(uNiz(tekst))) setTekst(spoljniTekst);
  }

  return [
    tekst,
    (s: string) => {
      setTekst(s);
      primeni(uNiz(s));
    },
  ];
}

export default function LandingEditor({ value, onChange, disabled, handle, context }: Props) {
  const lp = value ?? PRAZAN;

  /*
   * `set` se nadovezuje na TEKUCE stanje, ne na `lp` zamrznut pri iscrtavanju.
   *
   * Sa zamrznutom kopijom se gubio rad: otpremanje slike od nekoliko megabajta
   * traje minutima i drzi `onChange` iz trenutka kad je pokrenuto. Kad se zavrsi,
   * upise `{ ...lp_od_pre, novoPolje: url }` i time vrati SVA ostala polja na
   * stanje od starta tog otpremanja.
   *
   * Izmereno na stvarnim podacima: GIF otpremljen u polje "slika uz problem"
   * zavrsio je u store-u u 22:39:35, a sledece otpremanje (zavrseno u 22:42:19)
   * je pokrenuto pre toga - pa je pri upisu prepisalo landing verzijom koja
   * `problemImage` nije imala. Fajl je ostao u store-u kao sirociste, a polje
   * prazno, bez ijedne poruke o gresci.
   */
  const set = (patch: Partial<LandingPage>) =>
    onChange((prev) => ({ ...(prev ?? PRAZAN), ...patch }));
  const tema = landingTheme(lp.theme);
  const [ai, setAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const [benefitsStr, setBenefitsStr] = usePoljeRedova(lp.benefits, benefitsToStr, parseBenefits,
    (v) => set({ benefits: v }));
  const [statsStr, setStatsStr] = usePoljeRedova(lp.stats, statsToStr, parseStats,
    (v) => set({ stats: v }));
  const [objectionsStr, setObjectionsStr] = usePoljeRedova(lp.objections, objectionsToStr, parseObjections,
    (v) => set({ objections: v }));

  /*
   * Isti krug je bio i ovde: zapeta i razmak su se gutali dok se kuca.
   *
   * Prazno mesto se ZADRZAVA, a ne izbacuje: ikona se vezuje za pasus
   * POLOZAJEM u nizu. Sa izbacivanjem je "traffic, , sofa" davalo
   * ["traffic","sofa"], pa bi ikona treceg pasusa prelazila na drugi - a to
   * izgleda namerno i gore je od pasusa bez ikone. Odsecaju se samo prazna
   * mesta na kraju, koja ionako nemaju pasus na koji bi se odnosila.
   */
  const [storyIconsStr, setStoryIconsStr] = usePoljeRedova<string>(
    lp.storyIcons,
    (v) => (v ?? []).join(', '),
    (s) => {
      const delovi = s.split(',').map((x) => x.trim());
      while (delovi.length && !delovi[delovi.length - 1]) delovi.pop();
      return delovi;
    },
    (v) => set({ storyIcons: v })
  );

  /** Popunjava SAMO tekst; tema, boje i slike ostaju kako ih je korisnik postavio. */
  const generisi = async () => {
    if (!context?.title?.trim()) {
      setAiError('Prvo unesite naziv proizvoda.');
      return;
    }
    setAi(true);
    setAiError('');
    try {
      const res = await fetch('/api/admin/ai/generate-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Generisanje nije uspelo.');
      onChange((prev) => ({ ...(prev ?? PRAZAN), ...json.data }));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Generisanje nije uspelo.');
    } finally {
      setAi(false);
    }
  };

  return (
    <div className={styles.formSection}>
      <div className={styles.formSectionTitle}>
        <LayoutTemplate size={14} strokeWidth={2} /> Landing page format
      </div>

      <div className={styles.formGrid}>
        <div className={`form-group ${styles.formGridFull}`}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={lp.enabled}
              disabled={disabled}
              onChange={(e) => set({ enabled: e.target.checked })}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            Koristi Landing Page format za ovaj proizvod
          </label>
          <span className={styles.fieldHint}>
            Zamenjuje standardnu stranicu proizvoda narativnom prodajnom stranicom.
            Ostali proizvodi ostaju nepromenjeni.
          </span>
          <span className={styles.fieldHint}>
            U naslovima i tekstovima radi: <code>**podebljano**</code> i{' '}
            <code>{'{{istaknuto}}'}</code> — istaknuto dobija akcenatsku boju teme.
            U pasusima priče isticanje ide kroz <code>^^fraza^^</code>.
          </span>
        </div>

        {lp.enabled && (
          <div className={`form-group ${styles.formGridFull}`}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={generisi}
              disabled={disabled || ai}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Sparkles size={15} />
              {ai ? 'Generišem…' : 'Generiši Landing Page sadržaj pomoću AI'}
            </button>
            <span className={styles.fieldHint}>
              Piše tekst svih sekcija iz naziva, opisa i prednosti proizvoda — uključujući naslov preko
              slike, istaknute fraze u <code>{'{{}}'}</code> i predloge kategorija za statistiku (bez brojeva).
              Slike, temu i boje ne dira. Ništa ne ide uživo dok ne sačuvate, pa sve možete prethodno izmeniti.
            </span>
            {aiError && (
              <span className={styles.fieldHint} style={{ color: 'var(--color-error)' }}>{aiError}</span>
            )}
          </div>
        )}

        {lp.enabled && handle && (
          <div className={`form-group ${styles.formGridFull}`}>
            <a
              href={`/products/${handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <ExternalLink size={15} /> Pogledaj landing stranicu
            </a>
            <span className={styles.fieldHint}>
              Otvara se u novom tabu. Prikazuje POSLEDNJE SAČUVANO stanje — sačuvajte izmene pre provere.
            </span>
          </div>
        )}

        {lp.enabled && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="lpTheme">Tema</label>
              <select
                id="lpTheme"
                className="select"
                value={lp.theme}
                disabled={disabled}
                onChange={(e) => set({ theme: e.target.value })}
              >
                {LANDING_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <span
                className={styles.fieldHint}
                style={{
                  display: 'block', height: 10, marginTop: 8, borderRadius: 999,
                  background: `linear-gradient(120deg, ${lp.accentFrom || tema.from}, ${lp.accentTo || tema.to})`,
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Boje gradijenta (opciono)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="color"
                  aria-label="Početna boja gradijenta"
                  value={lp.accentFrom || tema.from}
                  disabled={disabled}
                  onChange={(e) => set({ accentFrom: e.target.value })}
                  style={{ width: '100%', height: 38, cursor: 'pointer' }}
                />
                <input
                  type="color"
                  aria-label="Završna boja gradijenta"
                  value={lp.accentTo || tema.to}
                  disabled={disabled}
                  onChange={(e) => set({ accentTo: e.target.value })}
                  style={{ width: '100%', height: 38, cursor: 'pointer' }}
                />
              </div>
              <span className={styles.fieldHint}>
                Prepisuju gradijent teme. Ostavite li ih netaknute, važi tema.
                <button
                  type="button"
                  onClick={() => set({ accentFrom: undefined, accentTo: undefined })}
                  disabled={disabled}
                  style={{ marginLeft: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--brand)', font: 'inherit' }}
                >
                  Vrati na temu
                </button>
              </span>
            </div>

            {/* 1. Hook */}
            <div className="form-group">
              <label className="form-label" htmlFor="lpBadge">Oznaka iznad naslova</label>
              <input id="lpBadge" className="input" value={lp.badge ?? ''} disabled={disabled}
                onChange={(e) => set({ badge: e.target.value })} placeholder="Npr. Novo u Srbiji" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lpHeroTitle">Glavni naslov</label>
              <input id="lpHeroTitle" className="input" value={lp.heroTitle ?? ''} disabled={disabled}
                onChange={(e) => set({ heroTitle: e.target.value })} placeholder="Prazno = naziv proizvoda" />
            </div>

            <div className={`form-group ${styles.formGridFull}`}>
              <label className="form-label" htmlFor="lpHeroLead">Uvodni tekst (postavlja problem)</label>
              <textarea id="lpHeroLead" className="textarea" rows={2} value={lp.heroLead ?? ''} disabled={disabled}
                onChange={(e) => set({ heroLead: e.target.value })}
                placeholder="Dve-tri rečenice koje opisuju situaciju u kojoj se kupac prepoznaje." />
            </div>

            {/* 2. Slika problema */}
            <div className="form-group">
              <label className="form-label">Slika uz problem</label>
              <ImageUploader
                value={lp.problemImage ? [lp.problemImage] : []}
                onChange={jednaSlika(lp.problemImage, (url) => set({ problemImage: url }))}
                disabled={disabled}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lpProblemTitle">Naslov PREKO slike (opciono)</label>
              <input id="lpProblemTitle" className="input" value={lp.problemTitle ?? ''} disabled={disabled}
                onChange={(e) => set({ problemTitle: e.target.value })}
                placeholder="Npr. 60 km slobode. {{Bez kapi goriva.}}" />
              <span className={styles.fieldHint}>
                Kad ovo popunite, tekst ide preko slike sa tamnim preklopom. Prazno = tekst ostaje ispod slike.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lpProblemBadge">Oznaka preko slike</label>
              <input id="lpProblemBadge" className="input" value={lp.problemBadge ?? ''} disabled={disabled}
                onChange={(e) => set({ problemBadge: e.target.value })}
                placeholder="Npr. Budućnost mobilnosti" />
              <span className={styles.fieldHint}>Prikazuje se samo uz naslov preko slike.</span>
            </div>

            <div className={`form-group ${styles.formGridFull}`}>
              <label className="form-label" htmlFor="lpProblemCaption">Rečenica uz sliku</label>
              <textarea id="lpProblemCaption" className="textarea" rows={3} value={lp.problemCaption ?? ''} disabled={disabled}
                onChange={(e) => set({ problemCaption: e.target.value })}
                placeholder="Kratka, udarna rečenica koja pojačava problem." />
            </div>

            {/* 3. Priča */}
            <div className={`form-group ${styles.formGridFull}`}>
              <label className="form-label" htmlFor="lpStory">Priča</label>
              <textarea id="lpStory" className="textarea" rows={8} value={lp.story ?? ''} disabled={disabled}
                onChange={(e) => set({ story: e.target.value })}
                placeholder={'Duži tekst, kao članak.\n\nPrazan red pravi novi pasus.'} />
              <span className={styles.fieldHint}>
                Prazan red razdvaja pasuse. Prvi pasus se prikazuje krupnije.
              </span>
              <span className={styles.fieldHint}>
                Isticanje u pasusima: <code>^^fraza^^</code> daje serifni font naslova u
                akcenatskoj boji teme. AI predlaže po jednu frazu u svakom pasusu, a vi je
                slobodno pomerite — dodajte ili uklonite <code>^^</code> oko bilo koje reči
                i tekst ostaje nedirnut. Kapice uvek zatvorite; nesparena se briše.
                Serifna fraza nosi istu akcenatsku boju kao <code>{'{{istaknuto}}'}</code>, pa u
                pasusima nema potrebe za zagradama — AI ih tu i ne predlaže.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lpStoryIcons">Ikone uz pasuse</label>
              <input id="lpStoryIcons" className="input" value={storyIconsStr} disabled={disabled}
                onChange={(e) => setStoryIconsStr(e.target.value)}
                placeholder="Npr. traffic, dumbbell, sofa" />
              <span className={styles.fieldHint}>
                Po jedno ime za svaki pasus, razdvojeno zapetom. Ista imena kao u karticama prednosti
                (traffic, dumbbell, sofa, home, clock, zap, shield, heart, truck, wallet, wrench...).
              </span>
            </div>

            {/* 4. Rešenje */}
            <div className="form-group">
              <label className="form-label" htmlFor="lpSolutionTitle">Naslov sekcije &bdquo;rešenje&ldquo;</label>
              <input id="lpSolutionTitle" className="input" value={lp.solutionTitle ?? ''} disabled={disabled}
                onChange={(e) => set({ solutionTitle: e.target.value })} placeholder="Prazno = naziv proizvoda" />
            </div>

            <div className="form-group">
              <label className="form-label">Slika proizvoda u toj sekciji</label>
              <ImageUploader
                value={lp.solutionImage ? [lp.solutionImage] : []}
                onChange={jednaSlika(lp.solutionImage, (url) => set({ solutionImage: url }))}
                disabled={disabled}
              />
              <span className={styles.fieldHint}>Prazno = glavna slika proizvoda.</span>
            </div>

            <div className={`form-group ${styles.formGridFull}`}>
              <label className="form-label" htmlFor="lpSolutionLead">Tekst uz rešenje</label>
              <textarea id="lpSolutionLead" className="textarea" rows={3} value={lp.solutionLead ?? ''} disabled={disabled}
                onChange={(e) => set({ solutionLead: e.target.value })}
                placeholder="Kako proizvod rešava problem opisan gore." />
            </div>

            {/* 5. Kartice prednosti */}
            <div className={`form-group ${styles.formGridFull}`}>
              <label className="form-label" htmlFor="lpBenefits">
                Kartice prednosti (ikona | naslov | podnaslov | opis | ✓ dodatak)
              </label>
              <textarea id="lpBenefits" className="textarea" rows={5}
                value={benefitsStr} disabled={disabled}
                onChange={(e) => setBenefitsStr(e.target.value)}
                placeholder={'zap | Montaža za 5 minuta | Bez alata | Zakačite i gotovo, ne buši se zid. | Bez registracije i dozvole\nshield | Dve godine garancije | Sigurna kupovina | Zamena bez pitanja. | Plaćanje pouzećem'} />
              <span className={styles.fieldHint}>
                Jedna kartica po liniji. Ikone: sparkles, zap, shield, check, clock, heart, home, leaf,
                lock, package, star, truck, wallet, wrench, gauge, battery.
              </span>
            </div>

            {/* 6. Statistika */}
            {/* Najava ka statistici */}
            <div className="form-group">
              <label className="form-label">Mala slika iznad statistike</label>
              <ImageUploader
                value={lp.statsImage ? [lp.statsImage] : []}
                onChange={jednaSlika(lp.statsImage, (url) => set({ statsImage: url }))}
                disabled={disabled}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lpStatsTitle">Naslov preko te slike</label>
              <input id="lpStatsTitle" className="input" value={lp.statsTitle ?? ''} disabled={disabled}
                onChange={(e) => set({ statsTitle: e.target.value })}
                placeholder="Npr. Brojke koje {{stoje iza}} proizvoda" />
              <span className={styles.fieldHint}>
                Manji i tiši od glavnog naslova preko slike — ovo je prelaz ka brojkama.
                Prikazuje se samo kad postoje i slika i naslov, i kad ispod ima bar jedne popunjene kartice.
              </span>
            </div>

            <div className={`form-group ${styles.formGridFull}`}>
              <label className="form-label" htmlFor="lpStats">Podaci koji grade poverenje (broj | opis)</label>
              <textarea id="lpStats" className="textarea" rows={3}
                value={statsStr} disabled={disabled}
                onChange={(e) => setStatsStr(e.target.value)}
                placeholder={'500+ | Zadovoljnih kupaca u regionu\n5 | godina iskustva\n14 | dana za povraćaj'} />
              <span className={styles.fieldHint}>
                <strong>Brojeve upisujete vi</strong> — AI predlaže samo kategoriju i ostavlja broj prazan,
                da se ne bi objavila izmišljena statistika. Kartica bez broja se ne prikazuje na sajtu.
                Broj se na stranici odbrojava od nule, uz traku koja se puni.
              </span>
            </div>

            {/* 7. Prigovori */}
            <div className={`form-group ${styles.formGridFull}`}>
              <label className="form-label" htmlFor="lpObjections">Strahovi i prigovori (pitanje | odgovor)</label>
              <textarea id="lpObjections" className="textarea" rows={4}
                value={objectionsStr} disabled={disabled}
                onChange={(e) => setObjectionsStr(e.target.value)}
                placeholder={'A ako mi ne odgovara? | Vraćate ga u roku od 14 dana, bez objašnjenja.\nMoram li da platim unapred? | Ne, plaćate kuriru pri preuzimanju.'} />
            </div>

            {/* 8. Kupovina */}
            <div className="form-group">
              <label className="form-label" htmlFor="lpCtaTitle">Naslov iznad dugmeta</label>
              <input id="lpCtaTitle" className="input" value={lp.ctaTitle ?? ''} disabled={disabled}
                onChange={(e) => set({ ctaTitle: e.target.value })} placeholder={'Prazno = „Naručite danas"'} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lpCtaLead">Tekst iznad dugmeta</label>
              <textarea id="lpCtaLead" className="textarea" rows={2} value={lp.ctaLead ?? ''} disabled={disabled}
                onChange={(e) => set({ ctaLead: e.target.value })} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
