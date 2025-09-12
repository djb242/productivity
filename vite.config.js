import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  plugins: [
    react(),
    {
      name: 'ics-proxy-dev',
      configureServer(server) {
        server.middlewares.use('/api/proxy-ics', async (req, res) => {
          const u = new URL(req.url, 'http://localhost')
          const target = u.searchParams.get('url')
          if (!target || !/^https:\/\//i.test(target)) {
            res.statusCode = 400
            res.end('Invalid url')
            return
          }
          try {
            const upstream = await fetch(target, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) PlannerICS/1.0 Safari/537.36',
                'Accept': 'text/calendar, text/plain, */*;q=0.1'
              }
            })
            const buf = Buffer.from(await upstream.arrayBuffer())
            res.statusCode = upstream.status
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Expose-Headers', '*')
            const ct = upstream.headers.get('content-type') || 'text/calendar; charset=utf-8'
            res.setHeader('Content-Type', ct)
            if (upstream.status >= 400) {
              res.setHeader('x-proxy-error', 'upstream')
              res.setHeader('x-upstream-status', String(upstream.status))
              try { res.setHeader('x-upstream-host', new URL(target).hostname) } catch {}
            }
            res.end(buf)
          } catch (e) {
            res.statusCode = 502
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Expose-Headers', '*')
            res.setHeader('x-proxy-error', 'exception')
            res.end('Proxy error')
          }
        })
      }
    }
  ]
})
