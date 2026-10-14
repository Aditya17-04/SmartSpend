import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'

function groqChatProxy(apiKey: string) {
  return {
    name: 'groq-chat-proxy',
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
            res.end(JSON.stringify({ error: 'GROQ_API_KEY is not configured.' }))
            return
          }

          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'qwen/qwen3.8-27b',
              messages: [{ role: 'user', content: body.prompt ?? '' }],
            }),
          })
          const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
          if (!response.ok) throw new Error(data.error?.message ?? 'Groq request failed')

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ answer: data.choices?.[0]?.message?.content ?? 'Groq returned no answer.' }))
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Groq request failed' }))
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
    groqChatProxy(env.GROQ_API_KEY),
  ],
  server: {
    port: 4000,
    host: '0.0.0.0',
  },
  }
})
