import type { VercelRequest, VercelResponse } from '@vercel/node';

// Fonte ufficiale: MIMIT "Osservaprezzi Carburanti" — rilevazione giornaliera alle 8:00
const MIMIT_URLS = [
  'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv',
  'https://www.mise.gov.it/images/exportCSV/prezzo_alle_8.csv',
];

const FALLBACK_PRICE = 1.89;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // Cache 4 ore su CDN Vercel, 1 ora stale-while-revalidate
  res.setHeader('Cache-Control', 'public, s-maxage=14400, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { price, stationsCount } = await fetchMIMITAverage();
    res.json({
      price,
      source: 'MIMIT — Osservaprezzi Carburanti',
      stationsCount,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[fuel-price] Fetch fallita:', err);
    res.json({
      price: FALLBACK_PRICE,
      source: 'default',
      stationsCount: 0,
      updatedAt: new Date().toISOString(),
    });
  }
}

async function fetchMIMITAverage(): Promise<{ price: number; stationsCount: number }> {
  let csvText: string | null = null;

  for (const url of MIMIT_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'PandinoApp/1.0 (car-sharing personale)' },
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const buffer = await res.arrayBuffer();
      // Il file MIMIT usa codifica Windows-1252 / ISO-8859-1
      csvText = new TextDecoder('iso-8859-1').decode(buffer);
      break;
    } catch {
      // prova l'URL successivo
    }
  }

  if (!csvText) throw new Error('Nessuna fonte MIMIT raggiungibile');

  const lines = csvText.split('\n');
  if (lines.length < 2) throw new Error('CSV vuoto');

  // Trova le colonne tramite header (robusto a cambi di formato)
  const header = lines[0].split(';').map(h => h.trim().toLowerCase().replace(/\r/g, ''));
  const iType  = header.findIndex(h => h.includes('carburante'));
  const iPrice = header.findIndex(h => h.includes('prezzo'));
  const iSelf  = header.findIndex(h => h.includes('self'));

  if (iType < 0 || iPrice < 0) {
    throw new Error(`Formato CSV non riconosciuto. Header: ${header.join(', ')}`);
  }

  const prices: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    if (parts.length < 3) continue;

    const type  = parts[iType]?.trim() ?? '';
    const raw   = parts[iPrice]?.replace(',', '.').trim() ?? '';
    const self  = iSelf >= 0 ? parts[iSelf]?.trim() : '1';
    const p     = parseFloat(raw);

    // Solo Benzina self-service con prezzo realistico (1.20 – 3.00 €/L)
    if (
      type.toLowerCase().includes('benzina') &&
      self === '1' &&
      !isNaN(p) && p >= 1.2 && p <= 3.0
    ) {
      prices.push(p);
    }
  }

  if (prices.length < 10) {
    throw new Error(`Dati insufficienti: trovate solo ${prices.length} rilevazioni benzina`);
  }

  // Media trimmed: escludi il 2.5% più basso e più alto (outlier)
  prices.sort((a, b) => a - b);
  const cut     = Math.max(1, Math.floor(prices.length * 0.025));
  const trimmed = prices.slice(cut, prices.length - cut);
  const avg     = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;

  return {
    price: Math.round(avg * 1000) / 1000,
    stationsCount: trimmed.length,
  };
}
