'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { ProductFaq } from '@/lib/types';
import styles from './ProductFAQ.module.css';

const FALLBACK_FAQS: ProductFaq[] = [
  { question: 'Koliko traje dostava?', answer: 'Dostava traje 1-3 radna dana širom Srbije, a paket vam stiže direktno na adresu.' },
  { question: 'Kako se vrši plaćanje?', answer: 'Plaćanje je pouzećem - kuriru platite gotovinom tek kada paket stigne, bez rizika unapred.' },
  { question: 'Da li mogu da vratim proizvod?', answer: 'Naravno. Ako niste zadovoljni, javite nam se u roku od 14 dana radi zamene ili povraćaja novca.' },
  { question: 'Šta ako imam dodatna pitanja?', answer: 'Naš tim za podršku je tu za vas - pišite nam i odgovorićemo u najkraćem roku.' },
];

export default function ProductFAQ({ faqs }: { faqs?: ProductFaq[] }) {
  const list = faqs && faqs.length > 0 ? faqs : FALLBACK_FAQS;
  const [open, setOpen] = useState(0);

  return (
    <div className={styles.list}>
      {list.map((f, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={f.question}
            className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              className={styles.trigger}
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              <span className={styles.icon}><HelpCircle size={16} /></span>
              <span className={styles.question}>{f.question}</span>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className={styles.chevron}>
                <ChevronDown size={18} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className={styles.panelWrap}
                >
                  <p className={styles.panel}>{f.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
