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

export default async function handler(req: ChatRequest, res: ChatResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const data = await response.json() as GeminiResponse;

    if (!response.ok) {
      res.status(502).json({ error: data.error?.message ?? 'Gemini request failed' });
      return;
    }

    res.status(200).json({ answer: data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Gemini returned no answer.' });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'Gemini request failed' });
  }
}