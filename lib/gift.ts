/**
 * Poklon iznenađenje — dodatna stavka uz porudžbinu.
 *
 * Nema svoj identitet u katalogu: kupac ne bira konkretan proizvod, nego samo
 * čekira da želi poklon. Zato ovde stoje cena i naziv, a ne u `products.json` —
 * poklon se ne pretražuje, nema stranicu ni zalihe.
 *
 * Opcija je GLOBALNA, dostupna uz svaku porudžbinu. Ako zatreba po proizvodu,
 * dovoljno je dodati polje na `Product` i ovde proveriti njega — ostatak lanca
 * (korpa, checkout, porudžbina, admin) ostaje isti.
 */

export const GIFT_PRICE = 490;
export const GIFT_TITLE = 'Poklon iznenađenje';

/**
 * Poklon se NE računa u prag za besplatnu dostavu.
 *
 * Prag je nagrada za vrednost kupljene robe; da poklon ulazi u njega, dodavanje
 * poklona od 490 RSD moglo bi samo sebi da otključa besplatnu dostavu i tako
 * košta prodavnicu više nego što donosi.
 */
export function giftTotal(hasGift: boolean): number {
  return hasGift ? GIFT_PRICE : 0;
}
