import { Fragment } from 'react';
import styles from './LandingPage.module.css';

/**
 * Sitno isticanje unutar teksta landing stranice:
 *
 *   **podebljano**   ->  <strong>
 *   {{istaknuto}}    ->  akcenatska boja teme
 *
 * Namerno gradi React cvorove umesto HTML stringa: tekst dolazi iz admin
 * panela, pa bi dangerouslySetInnerHTML bio ulaz za skriptu. Ovako je
 * nemoguce - sta god da se upise zavrsi kao tekst.
 */
const OBRAZAC = /(\*\*[^*]+\*\*|\{\{[^}]+\}\})/g;

export default function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(OBRAZAC).map((deo, i) => {
        if (deo.startsWith('**') && deo.endsWith('**')) {
          return <strong key={i}>{deo.slice(2, -2)}</strong>;
        }
        if (deo.startsWith('{{') && deo.endsWith('}}')) {
          return <span key={i} className={styles.highlight}>{deo.slice(2, -2)}</span>;
        }
        return <Fragment key={i}>{deo}</Fragment>;
      })}
    </>
  );
}
