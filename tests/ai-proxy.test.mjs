// Uji proxy /api/chat/completions tanpa Vercel: handler edge dipanggil langsung
// dengan fetch tiruan. Yang dijaga: kunci tidak pernah bocor ke klien, model
// ditentukan server, dan penolakan lintas-origin.
import assert from "node:assert/strict";

process.env.GOROUTER_API_KEY = "sk-uji-jangan-dipakai";
process.env.GOROUTER_BASE_URL = "https://gorouter.app/v1";
process.env.GOROUTER_MODEL = "claude-opus-5";

const handler = (await import("../api/chat/completions.js")).default;

const realFetch = globalThis.fetch;
let seen = null;
const okReply = { choices: [{ message: { content: "halo" } }] };
globalThis.fetch = async (url, init) => {
  seen = { url, init };
  return new Response(JSON.stringify(okReply), { status: 200, headers: { "Content-Type": "application/json" } });
};

const post = (body, headers = {}) =>
  handler(new Request("https://kelas-c-navy.vercel.app/api/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", host: "kelas-c-navy.vercel.app", ...headers },
    body: JSON.stringify(body),
  }));

// 1. Jalur normal: klien tidak mengirim model maupun kunci; server yang menentukan.
{
  seen = null;
  const res = await post({ messages: [{ role: "user", content: "hai" }] });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).choices[0].message.content, "halo");
  const sent = JSON.parse(seen.init.body);
  assert.equal(sent.model, "claude-opus-5", "model harus dipaksa server");
  assert.equal(seen.url, "https://gorouter.app/v1/chat/completions");
  assert.equal(seen.init.headers.Authorization, "Bearer sk-uji-jangan-dipakai");
}

// 2. Klien tidak bisa memilih model lain (mis. model mahal) lewat body.
{
  seen = null;
  await post({ model: "gpt-5.6-sol", messages: [{ role: "user", content: "hai" }] });
  assert.equal(JSON.parse(seen.init.body).model, "claude-opus-5");
}

// 3. Balasan ke klien tidak boleh memuat kunci sama sekali.
{
  const res = await post({ messages: [{ role: "user", content: "hai" }] });
  const text = await res.text();
  assert.ok(!text.includes("sk-uji"), "kunci tidak boleh ikut di respons");
  assert.equal(res.headers.get("Cache-Control"), "no-store");
}

// 4. Origin dari situs lain ditolak sebelum menyentuh GoRouter.
{
  seen = null;
  const res = await post({ messages: [{ role: "user", content: "hai" }] }, { origin: "https://situs-lain.example" });
  assert.equal(res.status, 403);
  assert.equal(seen, null, "permintaan lintas-origin tidak boleh diteruskan");
}

// 5. Origin sendiri diterima.
{
  const res = await post({ messages: [{ role: "user", content: "hai" }] }, { origin: "https://kelas-c-navy.vercel.app" });
  assert.equal(res.status, 200);
}

// 6. Body tanpa messages ditolak, bukan diteruskan.
{
  seen = null;
  assert.equal((await post({})).status, 400);
  assert.equal((await post({ messages: [] })).status, 400);
  assert.equal((await post({ messages: [{ role: "system", content: 1 }] })).status, 400);
  assert.equal(seen, null);
}

// 7. Peran aneh disaring, isi non-string dibuang.
{
  seen = null;
  await post({ messages: [{ role: "hacker", content: "x" }, { role: "user", content: "sah" }] });
  const sent = JSON.parse(seen.init.body);
  assert.deepEqual(sent.messages, [{ role: "user", content: "sah" }]);
}

// 8. Metode selain POST ditolak.
{
  const res = await handler(new Request("https://kelas-c-navy.vercel.app/api/chat/completions", { method: "GET" }));
  assert.equal(res.status, 405);
}

// 9. Kegagalan upstream dilaporkan apa adanya, tanpa membocorkan kunci.
{
  globalThis.fetch = async () => new Response('{"error":{"message":"kredit habis"}}', { status: 402 });
  const res = await post({ messages: [{ role: "user", content: "hai" }] });
  assert.equal(res.status, 402);
  const body = await res.text();
  assert.ok(body.includes("kredit habis"));
  assert.ok(!body.includes("sk-uji"));
}

// 10. Kunci belum diatur: gagal jujur, bukan memanggil GoRouter tanpa kunci.
{
  let called = false;
  globalThis.fetch = async () => { called = true; return new Response("{}"); };
  delete process.env.GOROUTER_API_KEY;
  const res = await post({ messages: [{ role: "user", content: "hai" }] });
  assert.equal(res.status, 503);
  assert.equal(called, false);
  process.env.GOROUTER_API_KEY = "sk-uji-jangan-dipakai";
}

globalThis.fetch = realFetch;
console.log("proxy AI behaviour: OK");
