// Cloudflare Pages Worker: site-wide HTTP Basic Auth + SPA fallback + security headers
// Set env vars in Cloudflare Pages: BASIC_USER, BASIC_PASS

export default {
  async fetch(request, env, ctx) {
    // Require Basic Auth for all requests
    const authHeader = request.headers.get('Authorization') || ''
    const user = env.BASIC_USER
    const pass = env.BASIC_PASS

    if (!user || !pass) {
      // Fail closed if not configured, so the site isn't accidentally public
      return new Response('Server not configured', { status: 500 })
    }

    if (!isAuthorized(authHeader, user, pass)) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Restricted"' }
      })
    }

    // Proxy ICS fetches with CORS enabled (for calendar subscriptions)
    const url = new URL(request.url)
    if (url.pathname === '/api/proxy-ics' && request.method === 'GET') {
      const target = url.searchParams.get('url') || ''
      try {
        if (!target || !/^https:\/\//i.test(target)) {
          return new Response('Invalid url', { status: 400 })
        }
        // Basic SSRF guard: disallow localhost and link-local ranges
        const t = new URL(target)
        if (/^(localhost|127\.|0\.0\.0\.0)/i.test(t.hostname)) {
          return new Response('Blocked host', { status: 400 })
        }
        const upstream = await fetch(target, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) PlannerICS/1.0 Safari/537.36',
            'Accept': 'text/calendar, text/plain, */*;q=0.1'
          }
        })
        const body = await upstream.arrayBuffer()
        const h = new Headers(upstream.headers)
        // Force content type if missing
        if (!h.get('content-type')) {
          h.set('content-type', 'text/calendar; charset=utf-8')
        }
        // Enable CORS
        h.set('Access-Control-Allow-Origin', '*')
        h.set('Access-Control-Expose-Headers', '*')
        // Surface upstream issues for debugging
        if (upstream.status >= 400) {
          h.set('x-proxy-error', 'upstream')
          h.set('x-upstream-status', String(upstream.status))
          h.set('x-upstream-host', t.hostname)
        }
        return new Response(body, { status: upstream.status, headers: h })
      } catch (e) {
        const h = new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': '*',
          'content-type': 'text/plain; charset=utf-8',
          'x-proxy-error': 'exception'
        })
        return new Response('Proxy error', { status: 502, headers: h })
      }
    }

    // OpenAI Prompt proxy (server-side; avoids exposing API key)
    if (url.pathname === '/api/prompt') {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      }
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: { message: 'Method Not Allowed' } }), {
          status: 405,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        })
      }
      const key = env.OPENAI_API_KEY
      if (!key) {
        return new Response(JSON.stringify({ error: { message: 'Server not configured: missing OPENAI_API_KEY' } }), {
          status: 500,
          headers: { 'content-type': 'application/json; charset=utf-8' }
        })
      }
      try {
        const body = await request.json().catch(() => ({}))
        const payload = {
          model: typeof body?.model === 'string' ? body.model : 'gpt-4o-mini',
          messages: Array.isArray(body?.messages) ? body.messages : [ { role: 'user', content: 'Give me one short writing prompt for today.' } ],
          temperature: typeof body?.temperature === 'number' ? body.temperature : 1,
          ...(typeof body?.max_tokens === 'number' ? { max_tokens: body.max_tokens } : {})
        }
        const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
        const responseBody = await upstream.arrayBuffer()
        const h = new Headers(upstream.headers)
        h.set('Access-Control-Allow-Origin', '*')
        h.set('Access-Control-Expose-Headers', '*')
        if (!h.get('content-type')) h.set('content-type', 'application/json; charset=utf-8')
        return new Response(responseBody, { status: upstream.status, headers: h })
      } catch (e) {
        const h = new Headers({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Expose-Headers': '*',
          'content-type': 'application/json; charset=utf-8'
        })
        return new Response(JSON.stringify({ error: { message: 'Proxy error' } }), { status: 502, headers: h })
      }
    }

    // Serve static assets. Add SPA fallback for client-side routes.
    let res = await env.ASSETS.fetch(request)

    if (res.status === 404 && request.method === 'GET') {
      const accept = request.headers.get('Accept') || ''
      if (accept.includes('text/html')) {
        const url = new URL(request.url)
        const indexReq = new Request(new URL('/index.html', url.origin), request)
        res = await env.ASSETS.fetch(indexReq)
      }
    }

    // Add common security headers
    const h = new Headers(res.headers)
    h.set('X-Frame-Options', 'DENY')
    h.set('X-Content-Type-Options', 'nosniff')
    h.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    // Adjust CSP if you add external origins
    h.set(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; connect-src 'self' https:; script-src 'self';"
    )

    return new Response(res.body, { status: res.status, headers: h })
  }
}

function isAuthorized(authHeader, expectedUser, expectedPass) {
  if (!authHeader.startsWith('Basic ')) return false
  try {
    const decoded = atob(authHeader.slice(6)) // base64("user:pass")
    const colon = decoded.indexOf(':')
    if (colon === -1) return false
    const user = decoded.slice(0, colon)
    const pass = decoded.slice(colon + 1)
    return user === expectedUser && pass === expectedPass
  } catch (_) {
    return false
  }
}
