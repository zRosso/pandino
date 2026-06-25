import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const FALLBACK_PRICE = 1.89;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=14400, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!GEMINI_API_KEY) {
    console.warn('[fuel-price] GEMINI_API_KEY non configurata');
    return res.json({
      price: FALLBACK_PRICE,
      source: 'default',
      error: 'API key mancante — configurare GEMINI_API_KEY su Vercel',
      updatedAt: new Date().toISOString(),
    });
  }

  try {
    const price = await fetchPriceWithGemini();
    res.json({
      price,
      source: 'Gemini AI · Google Search',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[fuel-price] Errore Gemini:', msg);
    res.json({
      price: FALLBACK_PRICE,
      source: 'default',
      error: msg,
      updatedAt: new Date().toISOString(),
    });
  }
}

async function fetchPriceWithGemini(): Promise<number> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{
      parts: [{
        text: 'Qual è il prezzo medio attuale della benzina self-service in Italia oggi? Rispondi SOLO con il numero in formato decimale con il punto (esempio: 1.847). Nessuna parola aggiuntiva.',
      }],
    }],
    tools: [{ google_search: {} }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 50,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini HTTP ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    error?: { message?: string };
  };

  if (data.error?.message) throw new Error(`Gemini API error: ${data.error.message}`);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  if (!text) throw new Error('Risposta Gemini vuota');

  const normalized = text.replace(',', '.');
  const match = normalized.match(/\b(\d+\.\d{2,4})\b/);
  if (!match) throw new Error(`Prezzo non trovato nella risposta: "${text}"`);

  const price = parseFloat(match[1]);
  if (isNaN(price) || price < 1.2 || price > 3.5) {
    throw new Error(`Prezzo fuori range: ${price} (risposta: "${text}")`);
  }

  return Math.round(price * 1000) / 1000;
}
