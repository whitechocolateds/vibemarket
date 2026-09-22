import RichText from './RichText';
import styles from './LandingPage.module.css';

/**
 * Slika sa tekstom preko nje. Koristi se dva puta: krupno za glavnu "problem"
 * sliku i `compact` za malu najavu iznad statistike - zato je izdvojeno,
 * umesto da isti markup stoji na dva mesta i razilazi se.
 */
export default function OverlayFigure({
  image, title, badge, caption, compact = false,
}: {
  image: string;
  title: string;
  badge?: string;
  caption?: string;
  compact?: boolean;
}) {
  return (
    <figure className={`${styles.figure} ${styles.figureOverlay} ${compact ? styles.figureCompact : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className={styles.figureImg} loading="lazy" />
      <div className={styles.figureScrim} aria-hidden="true" />
      <figcaption className={styles.figureText}>
        {badge && (
          <span className={`${styles.pill} ${styles.pillGlass}`}>
            <span className={styles.pillDot} aria-hidden="true" />
            {badge}
          </span>
        )}
        <p className={styles.figureTitle}><RichText text={title} /></p>
        {caption && <p className={styles.figureLead}><RichText text={caption} /></p>}
      </figcaption>
    </figure>
  );
}
