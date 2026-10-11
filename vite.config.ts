import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

function geminiChatProxy(apiKey: string) {
  return {
    name: 'gemini-chat-proxy',
    configureServer(server: { middlewares: { use: (handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || req.url !== '/api/chat') {
          next()
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(Buffer.from(chunk))

        try {
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { prompt?: string }
          if (!apiKey) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' }))
            return
          }

          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: body.prompt ?? '' }] }] }),
          })
          const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } }
          if (!response.ok) throw new Error(data.error?.message ?? 'Gemini request failed')

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ answer: data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Gemini returned no answer.' }))
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Gemini request failed' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    geminiChatProxy(env.GEMINI_API_KEY),
  ],
  server: {
    port: 4000,
    host: '0.0.0.0',
  },
  }
})
