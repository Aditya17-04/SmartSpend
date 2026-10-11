interface ChatRequest {
  method?: string;
  body?: unknown;
}

interface ChatResponse {
  status: (code: number) => ChatResponse;
  json: (body: unknown) => void;
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
}

const environment = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

async function requestGemini(apiKey: string, prompt: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    return await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: ChatRequest, res: ChatResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = environment?.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) as { prompt?: string } : req.body as { prompt?: string } | undefined;
  const prompt = body?.prompt?.trim();
  if (!prompt) {
    res.status(400).json({ error: 'A prompt is required.' });
    return;
  }

  try {
    let response = await requestGemini(apiKey, prompt);
    let data = await response.json() as GeminiResponse;

    if (!response.ok && response.status >= 500) {
      response = await requestGemini(apiKey, prompt);
      data = await response.json() as GeminiResponse;
    }

    if (!response.ok) {
      console.error('Gemini request failed', { status: response.status, message: data.error?.message });
      res.status(502).json({ error: data.error?.message ?? 'Gemini request failed' });
      return;
    }

    res.status(200).json({ answer: data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Gemini returned no answer.' });
  } catch (error) {
    console.error('Gemini request error', error);
    res.status(502).json({ error: error instanceof Error ? error.message : 'Gemini request failed' });
  }
}