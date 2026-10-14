interface ChatRequest {
  method?: string;
  body?: unknown;
}

interface ChatResponse {
  status: (code: number) => ChatResponse;
  json: (body: unknown) => void;
}

interface GroqResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

const environment = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'qwen/qwen3.8-27b';

async function requestGroq(apiKey: string, prompt: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    return await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
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

  const apiKey = environment?.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) as { prompt?: string } : req.body as { prompt?: string } | undefined;
  const prompt = body?.prompt?.trim();
  if (!prompt) {
    res.status(400).json({ error: 'A prompt is required.' });
    return;
  }

  try {
    let response = await requestGroq(apiKey, prompt);
    let data = await response.json() as GroqResponse;

    if (!response.ok && response.status >= 500) {
      response = await requestGroq(apiKey, prompt);
      data = await response.json() as GroqResponse;
    }

    if (!response.ok) {
      console.error('Groq request failed', { status: response.status, message: data.error?.message });
      res.status(502).json({ error: data.error?.message ?? 'Groq request failed' });
      return;
    }

    res.status(200).json({ answer: data.choices?.[0]?.message?.content ?? 'Groq returned no answer.' });
  } catch (error) {
    console.error('Groq request error', error);
    res.status(502).json({ error: error instanceof Error ? error.message : 'Groq request failed' });
  }
}