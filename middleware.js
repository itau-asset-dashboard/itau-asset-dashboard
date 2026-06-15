export const config = {
  matcher: ['/((?!login|api).*)'],
}

export default function middleware(request) {
  const cookie = request.headers.get('cookie') || ''
  const authenticated = cookie.split(';').some(c => c.trim().startsWith('itau_auth=ok'))
  if (!authenticated) {
    return Response.redirect(new URL('/login', request.url))
  }
}
