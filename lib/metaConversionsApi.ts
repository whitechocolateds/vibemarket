/**
 * Server-side Meta Conversions API - šalje isti event koji Pixel šalje sa klijenta,
 * kao "backup" kanal koji radi i kad browser blokira Pixel (ad-blocker, ITP, itd).
 * Radi tek kada su META_PIXEL_ID i META_CONVERSIONS_API_TOKEN podešeni u env - u suprotnom je no-op.
 */
interface CapiEventInput {
  eventName: string;
  eventId?: string;
  eventSourceUrl?: string;
  value?: number;
  currency?: string;
  contentIds?: string[];
  clientIp?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export function isMetaCapiEnabled(): boolean {
  return Boolean(process.env.META_PIXEL_ID && process.env.META_CONVERSIONS_API_TOKEN);
}

/*
 * Polupodeseno stanje se javlja jednom po procesu.
 *
 * Token bez META_PIXEL_ID je najskuplja tiha greska ovde: izgleda kao da je
 * server-side pracenje ukljuceno, a `isMetaCapiEnabled` vraca false i nijedna
 * kupovina ne stigne do Mete. Bez ove poruke se primeti tek kad se uporede
 * porudzbine u bazi sa brojem u Events Manageru.
 */
let upozoreno = false;
function upozoriNaPolaPodeseno(): void {
  if (upozoreno) return;
  upozoreno = true;
  console.warn(
    '[meta] META_CONVERSIONS_API_TOKEN je postavljen, ali META_PIXEL_ID nije - ' +
      'Conversions API je iskljucen i nijedan server-side event se ne salje. ' +
      'Upisi META_PIXEL_ID (isti broj kao NEXT_PUBLIC_META_PIXEL_ID). Provera: npm run meta:check'
  );
}

export async function sendCapiEvent(input: CapiEventInput): Promise<void> {
  if (!isMetaCapiEnabled()) {
    if (process.env.META_CONVERSIONS_API_TOKEN && !process.env.META_PIXEL_ID) upozoriNaPolaPodeseno();
    return;
  }

  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CONVERSIONS_API_TOKEN;

  const body = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl,
        action_source: 'website',
        user_data: {
          client_ip_address: input.clientIp ?? undefined,
          client_user_agent: input.userAgent ?? undefined,
          fbp: input.fbp ?? undefined,
          fbc: input.fbc ?? undefined,
        },
        custom_data: {
          currency: input.currency ?? 'RSD',
          value: input.value,
          content_ids: input.contentIds,
          content_type: 'product',
        },
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('Meta CAPI event odbijen:', await res.text());
    }
  } catch (error) {
    console.error('Meta CAPI event nije uspeo:', error);
  }
}
