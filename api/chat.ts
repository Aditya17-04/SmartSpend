interface ChatRequest {
  method?: string;
  body?: unknown;
}

interface ChatResponse {
  status: (code: number) => ChatResponse;
  json: (body: unknown) => void;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string; code?: number };
}

const environment = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function requestGemini(apiKey: string, prompt: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    return await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 800,
          temperature: 0.7,
        },
      }),
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

    // Retry once on 5xx or 429 rate-limit (wait 2 s).
    if (!response.ok && (response.status >= 500 || response.status === 429)) {
      await new Promise(r => setTimeout(r, response.status === 429 ? 2000 : 500));
      response = await requestGemini(apiKey, prompt);
      data = await response.json() as GeminiResponse;
    }

    if (!response.ok) {
      console.error('Gemini request failed', { status: response.status, message: data.error?.message });
      res.status(502).json({ error: data.error?.message ?? 'Gemini request failed' });
      return;
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Gemini returned no answer.';
    res.status(200).json({ answer });
  } catch (error) {
    console.error('Gemini request error', error);
    res.status(502).json({ error: error instanceof Error ? error.message : 'Gemini request failed' });
  }
}
