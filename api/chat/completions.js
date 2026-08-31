// Proxy Copilot -> penyedia AI. Kunci API hanya hidup di sini (env server
// Vercel), tidak pernah ikut ke bundel JavaScript, jadi tidak terlihat di
// aplikasi.
// ponytail: penjaganya cuma cek Origin + batas ukuran. Endpoint ini tetap
// terbuka untuk siapa pun yang tahu URL-nya. Tambah login (Supabase Auth)
// kalau kredit mulai terpakai orang lain.

import { DEFAULT_MODEL, VENDORS, findModel } from '../../ai-catalog.mjs'

const MAX_BODY = 200_000

// Edge runtime: tanda tangan Request/Response di bawah ini memang bentuknya.
export const config = { runtime: 'edge' }

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

export default async function handler(request) {
  if (request.method !== 'POST') return json(405, { error: 'Hanya POST.' })

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

  let body
  try { body = JSON.parse(raw) } catch { return json(400, { error: 'Body bukan JSON yang valid.' }) }
  const messages = body.messages
  if (!Array.isArray(messages) || !messages.length) return json(400, { error: 'Field messages wajib berisi array.' })

  // Klien boleh memilih model, tapi hanya dari katalog. Id di luar katalog
  // ditolak supaya kunci tidak bisa dipakai memanggil model mahal sembarangan.
  const requested = typeof body.model === 'string' && body.model ? body.model : DEFAULT_MODEL
  const model = findModel(requested)
  if (!model) return json(400, { error: `Model tidak dikenal: ${requested.slice(0, 80)}` })

  const vendor = VENDORS[model.vendor]
  const key = process.env[vendor.keyEnv]
  if (!key) return json(503, { error: `${vendor.keyEnv} belum diatur di server.` })

  const clean = messages
    .filter((m) => m && typeof m.content === 'string' && ['system', 'user', 'assistant'].includes(m.role))
    .map(({ role, content }) => ({ role, content }))
  if (!clean.length) return json(400, { error: 'Tidak ada pesan yang bisa dikirim.' })

  const upstream = await fetch(`${vendor.base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: model.id, messages: clean, temperature: 0.3 }),
    signal: AbortSignal.timeout(60_000),
  }).catch((e) => e)

  if (upstream instanceof Error) {
    const timeout = upstream.name === 'TimeoutError'
    return json(timeout ? 504 : 502, { error: timeout ? `${model.label} tidak menjawab dalam 60 detik.` : `Gagal menghubungi ${model.label}: ${upstream.message}` })
  }

  const text = await upstream.text()
  if (!upstream.ok) return json(upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status, { error: `${model.label} menolak permintaan (${upstream.status}): ${text.slice(0, 300)}` })

  return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}
