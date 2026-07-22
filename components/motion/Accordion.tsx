'use client';

import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Info } from 'lucide-react';
import styles from './Accordion.module.css';

interface Item {
  title: string;
  content: ReactNode;
}

export default function Accordion({ items, defaultOpen = 0 }: { items: Item[]; defaultOpen?: number }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className={styles.accordion}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={`${styles.item} ${isOpen ? styles.itemOpen : ''}`}>
            <button
              type="button"
              className={styles.trigger}
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <div className={styles.titleWrap}>
                <div className={styles.iconWrap}>
                  <Info size={16} />
                </div>
                <span className={styles.titleText}>{item.title}</span>
              </div>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={styles.chevronWrap}
              >
                <ChevronDown size={18} />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={styles.panelWrap}
                >
                  <div className={styles.panelInner}>
                    <div className={styles.panel}>{item.content}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
