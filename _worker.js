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

