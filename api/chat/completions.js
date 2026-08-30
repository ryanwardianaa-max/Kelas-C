// Proxy Copilot -> GoRouter. Kunci API hanya hidup di sini (env server Vercel),
// tidak pernah ikut ke bundel JavaScript, jadi tidak terlihat di aplikasi.
// ponytail: penjaganya cuma cek Origin + batas ukuran. Endpoint ini tetap
// terbuka untuk siapa pun yang tahu URL-nya. Tambah login (Supabase Auth)
// kalau kredit GoRouter mulai terpakai orang lain.

const BASE = (process.env.GOROUTER_BASE_URL || 'https://gorouter.app/v1').replace(/\/+$/, '')
const MODEL = process.env.GOROUTER_MODEL || 'claude-opus-5'
const MAX_BODY = 200_000

// Edge runtime: tanda tangan Request/Response di bawah ini memang bentuknya.
export const config = { runtime: 'edge' }

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

export default async function handler(request) {
  if (request.method !== 'POST') return json(405, { error: 'Hanya POST.' })

  const key = process.env.GOROUTER_API_KEY
  if (!key) return json(503, { error: 'GOROUTER_API_KEY belum diatur di server.' })

  // Batasi ke permintaan dari aplikasi sendiri; menahan pemakaian lintas situs.
  const origin = request.headers.get('origin')
  if (origin) {
    const host = request.headers.get('host')
    let same = false
    try { same = new URL(origin).host === host } catch { same = false }
    if (!same) return json(403, { error: 'Origin tidak diizinkan.' })
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY) return json(413, { error: 'Permintaan terlalu besar.' })

  let messages
  try { messages = JSON.parse(raw).messages } catch { return json(400, { error: 'Body bukan JSON yang valid.' }) }
  if (!Array.isArray(messages) || !messages.length) return json(400, { error: 'Field messages wajib berisi array.' })

  const clean = messages
    .filter((m) => m && typeof m.content === 'string' && ['system', 'user', 'assistant'].includes(m.role))
    .map(({ role, content }) => ({ role, content }))
  if (!clean.length) return json(400, { error: 'Tidak ada pesan yang bisa dikirim.' })

  // Model ditentukan server, bukan klien, supaya tidak bisa dipakai memanggil
  // model mahal lain dengan kunci ini.
  const upstream = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, messages: clean, temperature: 0.3 }),
    signal: AbortSignal.timeout(60_000),
  }).catch((e) => e)

  if (upstream instanceof Error) {
    const timeout = upstream.name === 'TimeoutError'
    return json(timeout ? 504 : 502, { error: timeout ? 'GoRouter tidak menjawab dalam 60 detik.' : `Gagal menghubungi GoRouter: ${upstream.message}` })
  }

  const text = await upstream.text()
  if (!upstream.ok) return json(upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status, { error: `GoRouter menolak permintaan (${upstream.status}): ${text.slice(0, 300)}` })

  return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}
