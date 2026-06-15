export const config = {
  matcher: ['/((?!login.html|arquitetura.html|api).*)'],
}

export default function middleware(request) {
  const cookie = request.headers.get('cookie') || ''
  const authenticated = cookie.split(';').some(c => c.trim().startsWith('itau_auth=ok'))
  if (!authenticated) {
    return Response.redirect(new URL('/login.html', request.url))
  }
}
