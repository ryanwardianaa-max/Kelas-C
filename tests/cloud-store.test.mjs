// Uji perilaku: menjalankan logika simpan sungguhan dengan cloud tiruan.
// Bukan pencocokan teks kode seperti uji lama.
import assert from "node:assert/strict";
import { commitCollection, commitValue, createWriteGate, removedIds, withTimeout } from "../src/lib/cloudStore.ts";

const item = (id) => ({ id, title: id });

const spyIO = (behaviour = {}) => {
  const calls = [];
  return {
    calls,
    io: {
      async upsert(kind, rows) {
        calls.push({ op: "upsert", kind, ids: rows.map((r) => r.id) });
        if (behaviour.failUpsert) throw new Error("upsert gagal");
      },
      async remove(kind, ids) {
        calls.push({ op: "remove", kind, ids });
        if (behaviour.failRemove) throw new Error("remove gagal");
      },
    },
  };
};

// 1. Sukses: upsert dahulu, hapus menyusul, hasil dikonfirmasi.
{
  const { io, calls } = spyIO();
  const result = await commitCollection("tasks", [item("a"), item("b")], [item("a"), item("c")], io);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.map((x) => x.id), ["a", "c"]);
  assert.deepEqual(calls, [
    { op: "upsert", kind: "tasks", ids: ["a", "c"] },
    { op: "remove", kind: "tasks", ids: ["b"] },
  ]);
}

// 2. Upsert gagal: penghapusan TIDAK pernah dikirim, hasil bukan ok.
{
  const { io, calls } = spyIO({ failUpsert: true });
  const result = await commitCollection("tasks", [item("a")], [], io);
  assert.equal(result.ok, false);
  assert.match(result.error, /upsert gagal/);
  assert.deepEqual(calls.map((c) => c.op), ["upsert"], "hapus tidak boleh berjalan setelah upsert gagal");
}

// 3. Hapus gagal: dilaporkan gagal, tidak pernah mengaku tersimpan.
{
  const { io } = spyIO({ failRemove: true });
  const result = await commitCollection("materials", [item("a")], [], io);
  assert.equal(result.ok, false);
  assert.match(result.error, /remove gagal/);
}

// 4. Tanpa penghapusan: perintah hapus tetap dikirim dengan daftar kosong dan aman.
{
  const { io, calls } = spyIO();
  const result = await commitCollection("references", [item("a")], [item("a"), item("b")], io);
  assert.equal(result.ok, true);
  assert.deepEqual(calls[1], { op: "remove", kind: "references", ids: [] });
}

// 5. Cloud menggantung: dibatasi waktu, bukan menggantung selamanya.
{
  const io = { upsert: () => new Promise(() => {}), remove: async () => {} };
  const result = await commitCollection("tasks", [], [item("a")], io, 20);
  assert.equal(result.ok, false);
  assert.match(result.error, /Waktu tunggu/);
}

// 6. Nilai tunggal (pengaturan): sukses dan gagal keduanya jujur.
{
  assert.deepEqual(await commitValue(async () => {}, { theme: "dark" }), { ok: true, value: { theme: "dark" } });
  const failed = await commitValue(async () => { throw new Error("tolak"); }, { theme: "dark" });
  assert.equal(failed.ok, false);
  assert.match(failed.error, /tolak/);
}

// 7. Pembantu murni.
{
  assert.deepEqual(removedIds([item("a"), item("b")], [item("b")]), ["a"]);
  assert.deepEqual(removedIds([], [item("a")]), []);
  assert.equal(await withTimeout(Promise.resolve(7), 50), 7);
}

// 8. Penjaga tulis: penyimpanan kedua yang tumpang-tindih ditolak, bukan dijalankan
//    dengan data lama; setelah selesai penjaga terbuka lagi walau sempat gagal.
{
  const gate = createWriteGate();
  let release;
  const first = gate.run(() => new Promise((resolve) => { release = () => resolve("pertama"); }));
  assert.equal(gate.busy, true);
  assert.equal(await gate.run(async () => "kedua"), "busy", "tulis kedua harus ditolak selama yang pertama berjalan");
  release();
  assert.equal(await first, "pertama");
  assert.equal(gate.busy, false);

  await assert.rejects(gate.run(async () => { throw new Error("gagal"); }), /gagal/);
  assert.equal(gate.busy, false, "penjaga harus terbuka lagi setelah kegagalan");
  assert.equal(await gate.run(async () => "lagi"), "lagi");
}

console.log("cloud store behaviour: OK");
