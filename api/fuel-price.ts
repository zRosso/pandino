import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const FALLBACK_PRICE = 1.89;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
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

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

async function callGemini(body: object): Promise<GeminiResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${errText.slice(0, 300)}`);
    }
    return await response.json() as GeminiResponse;
  } finally {
    clearTimeout(timeout);
  }
}

function extractPrice(text: string): number {
  // Gestisce sia "1.847" che "1,847" che "1,85" ecc.
  const normalized = text.replace(/\.(\d{3})/g, '$1').replace(',', '.');
  const match = normalized.match(/\b(1\.\d{2,3}|2\.\d{2,3})\b/);
  if (!match) {
    // Secondo tentativo: qualsiasi numero decimale plausibile
    const m2 = text.replace(',', '.').match(/\b(\d+\.\d{2,3})\b/);
    if (!m2) throw new Error(`Prezzo non trovato nella risposta: "${text.slice(0, 100)}"`);
    return parseFloat(m2[1]);
  }
  return parseFloat(match[1]);
}

async function fetchPriceWithGemini(): Promise<number> {
  const prompt = 'Qual è il prezzo medio attuale della benzina self-service in Italia? Rispondi SOLO con un numero decimale (es: 1.847). Niente altro.';

  // Tentativo 1: con Google Search grounding (dati in tempo reale)
  try {
    const data = await callGemini({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
    });
    if (data.error?.message) throw new Error(data.error.message);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    if (!text) throw new Error('Risposta vuota');
    const price = extractPrice(text);
    if (price < 1.2 || price > 3.5) throw new Error(`Fuori range: ${price}`);
    console.log(`[fuel-price] Grounding OK: "${text}" → ${price}`);
    return Math.round(price * 1000) / 1000;
  } catch (e) {
    console.warn('[fuel-price] Grounding fallito, provo senza:', (e as Error).message);
  }

  // Tentativo 2: senza grounding (conoscenza del modello)
  const data = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 64 },
  });
  if (data.error?.message) throw new Error(data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  if (!text) throw new Error('Risposta Gemini vuota');
  const price = extractPrice(text);
  if (price < 1.2 || price > 3.5) throw new Error(`Fuori range: ${price} (risposta: "${text}")`);
  console.log(`[fuel-price] Senza grounding: "${text}" → ${price}`);
  return Math.round(price * 1000) / 1000;
}
