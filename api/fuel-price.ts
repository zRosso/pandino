import type { VercelRequest, VercelResponse } from '@vercel/node';

// Fonte ufficiale: MIMIT "Osservaprezzi Carburanti" — rilevazione giornaliera alle 8:00
// NB: dal 10/02/2026 il separatore è cambiato da ";" a "|" — auto-rilevato dal codice
const MIMIT_URLS = [
  'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv',
  'https://www.mise.gov.it/images/exportCSV/prezzo_alle_8.csv',
];

// Headers che simulano un browser reale (alcuni server gov bloccano user-agent automatici)
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
};

const FALLBACK_PRICE = 1.89;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=14400, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { price, stationsCount, separator } = await fetchMIMITAverage();
    res.json({
      price,
      source: 'MIMIT — Osservaprezzi Carburanti',
      stationsCount,
      separator,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[fuel-price] Fetch fallita:', msg);
    res.json({
      price: FALLBACK_PRICE,
      source: 'default',
      stationsCount: 0,
      error: msg,
      updatedAt: new Date().toISOString(),
    });
  }
}

async function fetchMIMITAverage(): Promise<{ price: number; stationsCount: number; separator: string }> {
  let csvText: string | null = null;
  let lastError = '';

  for (const url of MIMIT_URLS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: BROWSER_HEADERS,
        redirect: 'follow',
      });
      clearTimeout(timeout);

      if (!response.ok) {
        lastError = `HTTP ${response.status} da ${url}`;
        continue;
      }

      const buffer = await response.arrayBuffer();
      // Il file usa ISO-8859-1 / Windows-1252 (caratteri italiani)
      csvText = new TextDecoder('iso-8859-1').decode(buffer);
      break;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  if (!csvText) throw new Error(`Nessuna fonte raggiungibile. Ultimo errore: ${lastError}`);

  const lines = csvText.split('\n');
  if (lines.length < 2) throw new Error('CSV vuoto o non valido');

  // --- Auto-rileva il separatore (MIMIT ha cambiato da ";" a "|" il 10/02/2026) ---
  const rawHeader = lines[0].replace(/\r/g, '');
  const separator = rawHeader.includes('|') ? '|' : ';';

  const header   = rawHeader.split(separator).map(h => h.trim().toLowerCase());
  const iType    = header.findIndex(h => h.includes('carburante'));
  const iPrice   = header.findIndex(h => h.includes('prezzo'));
  const iSelf    = header.findIndex(h => h === 'self' || h.includes('self'));

  if (iType < 0 || iPrice < 0) {
    throw new Error(`Formato CSV non riconosciuto (sep="${separator}"). Header: [${header.join(', ')}]`);
  }

  const prices: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line  = lines[i].replace(/\r/g, '');
    if (!line.trim()) continue;
    const parts = line.split(separator);
    if (parts.length <= Math.max(iType, iPrice)) continue;

    const type = parts[iType]?.trim() ?? '';
    const raw  = (parts[iPrice] ?? '').replace(',', '.').trim();
    // Se non c'è colonna self, assumiamo self-service (alcuni CSV non la hanno)
    const self = iSelf >= 0 ? parts[iSelf]?.trim() : '1';
    const p    = parseFloat(raw);

    if (
      type.toLowerCase().includes('benzina') &&
      self === '1' &&
      !isNaN(p) && p >= 1.2 && p <= 3.5
    ) {
      prices.push(p);
    }
  }

  if (prices.length < 10) {
    throw new Error(
      `Rilevazioni insufficienti: trovate ${prices.length} stazioni benzina ` +
      `(sep="${separator}", header=[${header.slice(0, 5).join(', ')}])`
    );
  }

  // Media trimmed: rimuove il 2.5% di outlier in alto e in basso
  prices.sort((a, b) => a - b);
  const cut     = Math.max(1, Math.floor(prices.length * 0.025));
  const trimmed = prices.slice(cut, prices.length - cut);
  const avg     = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;

  return {
    price: Math.round(avg * 1000) / 1000,
    stationsCount: trimmed.length,
    separator,
  };
}
