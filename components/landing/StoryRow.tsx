import Reveal from './Reveal';
import styles from './LandingPage.module.css';

/**
 * Jedan pasus price: ikona u levoj margini i tekst koji se pojavljuje kad
 * dodje u vidno polje.
 *
 * Samo raspored; otkrivanje skrolom radi Reveal, koji se koristi i drugde na
 * stranici (blok sa vodicima). Ranije je oboje stajalo ovde, pa je svako ko je
 * hteo isto pojavljivanje nasledjivao i uvlacenje od 42px za ikonu pasusa.
 */
export default function StoryRow({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Reveal className={styles.storyRow} delay={delay}>
      {children}
    </Reveal>
  );
}
