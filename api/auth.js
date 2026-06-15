export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  let password = ''
  try {
    const buffers = []
    for await (const chunk of req) buffers.push(chunk)
    const body = Buffer.concat(buffers).toString()
    const params = new URLSearchParams(body)
    password = params.get('password') || ''
  } catch (_) {
    return res.status(400).end()
  }

  if (password === process.env.AUTH_PASSWORD) {
    const maxAge = 60 * 60 * 24 * 30 // 30 dias
    res.setHeader('Set-Cookie', `itau_auth=ok; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`)
    res.writeHead(302, { Location: '/' })
    res.end()
  } else {
    res.writeHead(302, { Location: '/login.html?erro=1' })
    res.end()
  }
}
