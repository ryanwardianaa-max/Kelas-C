// Uji proxy /api/chat/completions tanpa Vercel: handler edge dipanggil langsung
// dengan fetch tiruan. Yang dijaga: kunci tidak pernah bocor ke klien, model
// hanya boleh dari katalog, kunci dipilih sesuai vendor model, dan penolakan
// lintas-origin.
import assert from "node:assert/strict";
import { DEFAULT_MODEL, MODELS, VENDORS } from "../ai-catalog.mjs";

process.env.GOROUTER_API_KEY = "sk-uji-gorouter-jangan-dipakai";
process.env.XKIRO_API_KEY = "sk-xt-uji-jangan-dipakai";

const handler = (await import("../api/chat/completions.js")).default;

const realFetch = globalThis.fetch;
let seen = null;
const okReply = { choices: [{ message: { content: "halo" } }] };
globalThis.fetch = async (url, init) => {
  seen = { url, init };
  return new Response(JSON.stringify(okReply), { status: 200, headers: { "Content-Type": "application/json" } });
};

const post = (body, headers = { origin: "https://kelas-c-navy.vercel.app" }) =>
  handler(new Request("https://kelas-c-navy.vercel.app/api/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", host: "kelas-c-navy.vercel.app", ...headers },
    body: JSON.stringify(body),
  }));

// 1. Tanpa model: pakai bawaan katalog, kunci vendor yang benar.
{
  seen = null;
  const res = await post({ messages: [{ role: "user", content: "hai" }] });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).choices[0].message.content, "halo");
  assert.equal(JSON.parse(seen.init.body).model, DEFAULT_MODEL);
  assert.equal(seen.url, "https://gorouter.app/v1/chat/completions");
  assert.equal(seen.init.headers.Authorization, "Bearer sk-uji-gorouter-jangan-dipakai");
}

// 2. Model xkiro diarahkan ke base + kunci xkiro, bukan kunci GoRouter.
{
  seen = null;
  await post({ model: "qwen/qwen3.5-flash:free", messages: [{ role: "user", content: "hai" }] });
  assert.equal(seen.url, "https://api.xkiro.com/v1/chat/completions");
  assert.equal(seen.init.headers.Authorization, "Bearer sk-xt-uji-jangan-dipakai");
  assert.equal(JSON.parse(seen.init.body).model, "qwen/qwen3.5-flash:free");
}

// 3. Model di luar katalog ditolak, tidak diteruskan ke vendor mana pun.
{
  seen = null;
  const res = await post({ model: "openai/gpt-5-mahal", messages: [{ role: "user", content: "hai" }] });
  assert.equal(res.status, 400);
  assert.equal(seen, null, "model tak dikenal tidak boleh diteruskan");
}

// 4. Setiap entri katalog punya vendor yang dikenal, kunci env-nya jelas, dan
//    nama yang layak tampil di pemilih model.
for (const m of MODELS) {
  assert.ok(VENDORS[m.vendor], `vendor tak dikenal pada ${m.id}`);
  assert.ok(VENDORS[m.vendor].keyEnv, `keyEnv kosong untuk vendor ${m.vendor}`);
  assert.ok(m.label, `label kosong pada ${m.id}`);
}
assert.equal(new Set(MODELS.map((m) => m.label)).size, MODELS.length, "label harus unik");
assert.equal(new Set(MODELS.map((m) => m.id)).size, MODELS.length, "id harus unik");
// Ryan meminta pemilih model menampilkan nama saja: tidak ada keterangan skill
// di katalog, supaya tidak diam-diam muncul lagi di UI.
for (const m of MODELS) assert.ok(!("note" in m), `${m.id} tidak boleh punya keterangan skill`);

// 5. Balasan ke klien tidak boleh memuat kunci sama sekali.
{
  const res = await post({ messages: [{ role: "user", content: "hai" }] });
  const text = await res.text();
  assert.ok(!text.includes("sk-uji"), "kunci tidak boleh ikut di respons");
  assert.ok(!text.includes("sk-xt-uji"));
  assert.equal(res.headers.get("Cache-Control"), "no-store");
}

// 6. Origin dari situs lain ditolak sebelum menyentuh vendor.
{
  seen = null;
  const res = await post({ messages: [{ role: "user", content: "hai" }] }, { origin: "https://situs-lain.example" });
  assert.equal(res.status, 403);
  assert.equal(seen, null, "permintaan lintas-origin tidak boleh diteruskan");
}

// 7. Origin sendiri diterima.
{
  const res = await post({ messages: [{ role: "user", content: "hai" }] }, { origin: "https://kelas-c-navy.vercel.app" });
  assert.equal(res.status, 200);
}

// 7b. Tanpa header Origin ditolak: curl/Postman/skrip tidak mengirimnya, jadi
//     inilah yang menahan orang lain memakai kredit AI hanya karena tahu URL.
{
  seen = null;
  const res = await handler(new Request("https://kelas-c-navy.vercel.app/api/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", host: "kelas-c-navy.vercel.app" },
    body: JSON.stringify({ messages: [{ role: "user", content: "hai" }] }),
  }));
  assert.equal(res.status, 403);
  assert.equal(seen, null, "permintaan tanpa Origin tidak boleh diteruskan");
}

// 8. Body tanpa messages ditolak, bukan diteruskan.
{
  seen = null;
  assert.equal((await post({})).status, 400);
  assert.equal((await post({ messages: [] })).status, 400);
  assert.equal((await post({ messages: [{ role: "system", content: 1 }] })).status, 400);
  assert.equal(seen, null);
}

// 9. Peran aneh disaring, isi non-string dibuang.
{
  seen = null;
  await post({ messages: [{ role: "hacker", content: "x" }, { role: "user", content: "sah" }] });
  assert.deepEqual(JSON.parse(seen.init.body).messages, [{ role: "user", content: "sah" }]);
}

// 10. Metode selain POST ditolak.
{
  const res = await handler(new Request("https://kelas-c-navy.vercel.app/api/chat/completions", { method: "GET" }));
  assert.equal(res.status, 405);
}

// 11. Kegagalan upstream dilaporkan apa adanya, tanpa membocorkan kunci.
{
  globalThis.fetch = async () => new Response('{"error":{"message":"kredit habis"}}', { status: 402 });
  const res = await post({ messages: [{ role: "user", content: "hai" }] });
  assert.equal(res.status, 402);
  const body = await res.text();
  assert.ok(body.includes("kredit habis"));
  assert.ok(!body.includes("sk-uji"));
}

// 12. Kunci vendor belum diatur: gagal jujur, bukan memanggil tanpa kunci.
{
  let called = false;
  globalThis.fetch = async () => { called = true; return new Response("{}"); };
  delete process.env.XKIRO_API_KEY;
  const res = await post({ model: "qwen/qwen3.5-flash:free", messages: [{ role: "user", content: "hai" }] });
  assert.equal(res.status, 503);
  assert.match(await res.text().then((t) => t), /XKIRO_API_KEY/);
  assert.equal(called, false);
  process.env.XKIRO_API_KEY = "sk-xt-uji-jangan-dipakai";
}

globalThis.fetch = realFetch;
console.log(`proxy AI behaviour: OK (${MODELS.length} model di katalog)`);
