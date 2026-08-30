// Uji perilaku jadwal: jam kuliah harus tetap WIB apa pun zona waktu perangkat.
// Dijalankan dua kali oleh runner (TZ=Asia/Jakarta dan TZ=UTC) — hasilnya wajib sama.
import assert from "node:assert/strict";
import { atTime, countdown, formatDate, getCurrentOrNext, wibToday } from "../src/lib/schedule.ts";

const course = (over = {}) => ({
  id: 1, code: "KP21517003", name: "Analisis Kompleks", sks: 2,
  dayIndex: 1, dayName: "Senin", startTime: "07:00", endTime: "08:40",
  room: "C.1.3", lecturer: "-", color: "#000", topics: [], ...over,
});

// Minggu 30 Agustus 2026, 23:53 WIB = 16:53Z. Kuliah Senin 07:00 WIB = 00:00Z Senin.
const now = new Date("2026-08-30T16:53:00.000Z");

// 1. Awal kuliah adalah saat mutlak yang benar, bukan jam dinding perangkat.
{
  const s = getCurrentOrNext([course()], now);
  assert.equal(s.start.toISOString(), "2026-08-31T00:00:00.000Z", "07:00 WIB harus 00:00Z");
  assert.equal(s.end.toISOString(), "2026-08-31T01:40:00.000Z");
  assert.equal(s.ongoing, false);
  // 16:53Z -> 00:00Z = 7 jam 7 menit. Nilai ini identik di zona waktu mana pun.
  assert.equal(s.remaining, (7 * 60 + 7) * 60000);
  assert.equal(countdown(s.remaining), "7 jam, 7 menit");
}

// 2. Kuliah yang sedang berlangsung dikenali, sisa waktu dihitung ke jam selesai.
{
  const during = new Date("2026-08-31T00:30:00.000Z"); // 07:30 WIB
  const s = getCurrentOrNext([course()], during);
  assert.equal(s.ongoing, true);
  assert.equal(countdown(s.remaining), "1 jam, 10 menit");
}

// 3. Setelah kuliah selesai, yang ditampilkan adalah pekan berikutnya.
{
  const after = new Date("2026-08-31T01:40:00.000Z"); // tepat jam selesai
  const s = getCurrentOrNext([course()], after);
  assert.equal(s.start.toISOString(), "2026-09-07T00:00:00.000Z", "harus melompat satu pekan penuh");
  assert.equal(s.ongoing, false);
}

// 4. Yang terdekat dipilih; yang sedang berlangsung selalu menang.
{
  const pagi = course({ id: 1, name: "Analisis Kompleks", startTime: "07:00", endTime: "08:40" });
  const siang = course({ id: 2, name: "Seminar", startTime: "09:35", endTime: "12:05" });
  assert.equal(getCurrentOrNext([siang, pagi], now).course.name, "Analisis Kompleks");
  const during = new Date("2026-08-31T00:30:00.000Z");
  assert.equal(getCurrentOrNext([siang, pagi], during).course.name, "Analisis Kompleks");
}

// 5. Hitungan pendek menampilkan detik supaya terasa berjalan; nol tidak negatif.
{
  assert.equal(countdown(45_000), "45 detik");
  assert.equal(countdown(125_000), "2 menit, 5 detik");
  assert.equal(countdown(3_600_000), "1 jam, 0 menit");
  assert.equal(countdown(90_000_000), "1 hari, 1 jam, 0 menit");
  assert.equal(countdown(-5000), "0 detik", "waktu lampau tidak boleh negatif");
}

// 6. Tanggal dinyatakan dalam WIB, bukan zona perangkat. 17:10Z Minggu masih
//    Minggu di WIB (00:10 Senin) — di UTC tampak Minggu juga, tapi 18:00Z
//    sudah Senin di WIB sedangkan masih Minggu di UTC.
{
  assert.match(formatDate(new Date("2026-08-30T18:00:00.000Z")), /Senin/, "01:00 WIB Senin harus tertulis Senin");
  assert.match(formatDate(new Date("2026-08-30T16:00:00.000Z")), /Minggu/);
}

// 7. Ekspor .ICS memakai saat mutlak yang sama dengan kartu beranda, ditulis
//    sebagai UTC eksplisit, sehingga kalender tujuan menggesernya sendiri.
{
  const start = atTime(now, 1, "07:00");
  assert.equal(start.toISOString(), "2026-08-31T00:00:00.000Z");
  // Pekan berikutnya = geser tepat 7 x 24 jam dari saat mutlak, bukan setDate lokal.
  assert.equal(new Date(start.getTime() + 7 * 86400000).toISOString(), "2026-09-07T00:00:00.000Z");
}

// 8. "Hari ini" mengikuti WIB. 18:00Z Minggu sudah 31 Agustus di WIB.
{
  assert.deepEqual(wibToday(new Date("2026-08-30T18:00:00.000Z")), { year: 2026, month: 7, date: 31, day: 1 });
  assert.deepEqual(wibToday(new Date("2026-08-30T16:00:00.000Z")), { year: 2026, month: 7, date: 30, day: 0 });
}

console.log(`schedule WIB behaviour: OK (TZ=${process.env.TZ ?? "OS"})`);
