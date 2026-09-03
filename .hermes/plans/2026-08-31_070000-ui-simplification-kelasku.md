# Penyederhanaan UI KelasKu — Implementation Plan

> **For Hermes:** Implementasikan hanya fase yang disetujui Ryan. Jangan mengubah semua halaman sekaligus.

**Goal:** Mengurangi kepadatan bacaan dan kesan “AI slop” tanpa menghilangkan fungsi akademik inti.

**Architecture:** Gunakan pendekatan bertahap: audit visual → fondasi desain → Beranda → navigasi → halaman isi → Copilot/Pengaturan. Pertahankan React/CSS yang ada; jangan menambah UI library. Arah visual: perpaduan Notion (hangat, content-first) dan Linear (rapi, hierarki presisi), bukan menyalin merek.

**Tech Stack:** React 19, TypeScript, CSS, Vite.

---

## Temuan utama

1. **Navigasi terlalu banyak:** sidebar memuat 9 tujuan sejajar; `Materi`, `Referensi`, `Kalender`, `Jadwal`, dan `Alat Bantu` bersaing sebagai menu utama.
2. **Beranda terlalu menjelaskan:** salam panjang, zona WIB, kartu kuliah berikutnya, rumus dekoratif, dua statistik, deadline, dan kemungkinan panel lain muncul dalam satu layar.
3. **Duplikasi identitas:** “KelasKu” dan konteks semester muncul di sidebar serta topbar.
4. **Kartu memuat banyak metadata:** kartu mata kuliah menampilkan kode, SKS, dosen, jadwal, ruang, dan jumlah tugas sekaligus.
5. **Terlalu banyak card/chip/label kapital:** struktur terasa seperti template dashboard generik, bukan alat kuliah yang tenang.
6. **Copy bernuansa sistem/AI:** teks seperti “Pencarian AI”, “Ditambahkan melalui Copilot”, status cloud panjang, dan label dekoratif membuat aplikasi terasa dibuat AI.
7. **Aksi tidak selalu memiliki prioritas:** banyak tombol memiliki bobot visual serupa; pengguna harus membaca sebelum tahu tindakan utama.
8. **Mobil masih padat:** lima item bottom navigation ditambah FAB Copilot berpotensi berebut ruang dan perhatian.

## Prinsip desain

- Satu layar, satu tujuan utama.
- Nama dulu; metadata hanya ketika dibutuhkan.
- Maksimal satu CTA utama per bagian.
- Card hanya untuk objek interaktif, bukan setiap blok teks.
- Warna mata kuliah sebagai aksen kecil, bukan dekorasi dominan.
- Teks penjelas dihapus bila label dan struktur sudah cukup jelas.
- Status normal tidak terus ditampilkan; tampilkan hanya saat menyimpan, gagal, atau baru selesai singkat.
- AI menjadi alat bantu opsional, bukan identitas visual aplikasi.
- Pertahankan aksesibilitas, target sentuh, dark mode, dan fungsi yang ada.

---

## Urutan implementasi yang disarankan

### Fase 0: Audit visual terukur

**Objective:** Menetapkan baseline sebelum mengubah UI.

**Files:** Tidak ada perubahan produk.

1. Ambil screenshot desktop dan mobile untuk Beranda, Mata Kuliah, Tugas, Materi, dan Copilot.
2. Catat jumlah heading, paragraf penjelas, kartu, tombol, chip, dan menu pada setiap layar.
3. Tandai elemen sebagai `inti`, `sekunder`, atau `hapus/sembunyikan`.
4. Tetapkan kriteria: layar utama dapat dipahami dalam 3–5 detik; aksi utama terlihat tanpa membaca paragraf.

**Validation:** Checklist before/after; screenshot pada viewport desktop dan 390px.

### Fase 1: Fondasi visual tenang

**Objective:** Menghilangkan kesan template/AI tanpa mengubah struktur fitur.

**Likely files:**
- Modify: `src/App.css`

1. Rapikan token warna menjadi warm-neutral light mode dan neutral-dark mode.
2. Kurangi variasi radius; gunakan 8px untuk kontrol, 12px untuk panel utama.
3. Hilangkan shadow kuat dan gradient dekoratif; gunakan border tipis.
4. Batasi tipografi ke 4 tingkat: page title, section title, body, metadata.
5. Hapus uppercase berlebihan; sisakan untuk badge/status singkat.
6. Standarkan jarak pada skala 4/8/12/16/24/32.
7. Pastikan focus ring dan kontras WCAG tetap terlihat.

**Validation:** Build, lint, screenshot light/dark, contrast check.

### Fase 2: Beranda ringkas — prioritas pertama

**Objective:** Beranda hanya menjawab “kuliah apa berikutnya?” dan “apa yang harus dikerjakan?”.

**Likely files:**
- Modify: `src/components/DashboardView.tsx`
- Modify: `src/App.css`

1. Ubah header menjadi salam pendek dan tanggal; pindahkan informasi WIB ke tooltip/metadata kecil atau hapus bila tidak diperlukan.
2. Pertahankan kartu “Kuliah berikutnya” sebagai fokus utama.
3. Hapus rumus dekoratif `z = x + iy`; tidak membawa informasi.
4. Gabungkan statistik “6 Mata Kuliah” dan “Tugas Aktif” menjadi metadata kecil, bukan dua kartu besar.
5. Tampilkan maksimal tiga deadline; sembunyikan deskripsi bila judul, mata kuliah, dan tenggat sudah cukup.
6. Gunakan satu CTA: `Lihat jadwal` atau `Lihat semua tugas`, sesuai konteks paling mendesak.
7. Empty state cukup satu kalimat + satu aksi; tanpa ilustrasi generik atau copy promosi.

**Validation:** Informasi utama terlihat tanpa scroll pada laptop umum; semua navigasi tetap bekerja.

### Fase 3: Navigasi dan chrome

**Objective:** Mengurangi beban memilih menu.

**Likely files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/MobileNav.tsx`
- Modify: `src/App.css`

1. Jadikan menu utama: `Beranda`, `Mata Kuliah`, `Jadwal`, `Tugas`.
2. Kelompokkan `Materi`, `Referensi`, `Kalender`, `Alat Bantu` dalam bagian sekunder “Lainnya” atau konteks mata kuliah.
3. Pertahankan `Pengaturan` di footer sidebar.
4. Hapus duplikasi nama aplikasi/subtitle di topbar desktop; topbar cukup judul halaman + aksi global.
5. Evaluasi ikon lonceng: hapus sampai notifikasi benar-benar memiliki fungsi.
6. Mobile navigation maksimal empat item + `Lainnya`; Copilot tidak boleh menutupi target navigasi.
7. Pastikan state aktif dan label tetap eksplisit; jangan mengandalkan ikon saja.

**Tradeoff:** Satu klik tambahan untuk fitur sekunder; imbalannya menu utama jauh lebih mudah dipindai.

### Fase 4: Mata Kuliah dan detail

**Objective:** Membuat daftar mata kuliah cepat dipindai.

**Likely files:**
- Modify: `src/components/CoursesView.tsx`
- Modify: `src/components/CourseDetailView.tsx`
- Modify: `src/App.css`

1. Kartu daftar hanya menampilkan nama, kode, jadwal singkat, dan jumlah tugas aktif.
2. Pindahkan dosen, ruang, dan SKS ke detail mata kuliah.
3. Ganti blok warna besar dengan garis/dot aksen mata kuliah.
4. Detail mata kuliah memakai tabs/segmented navigation: `Ringkasan`, `Pertemuan`, `Tugas`, `Materi`, `Referensi`.
5. Tampilkan ringkasan dulu; konten tab lain tidak dirender sekaligus.
6. Kurangi paragraf instruksi; gunakan empty state kontekstual.

**Validation:** Pengguna menemukan mata kuliah dan membuka tugasnya dengan maksimal dua interaksi.

### Fase 5: Tugas, Materi, Referensi, Jadwal

**Objective:** Menyamakan pola baca dan aksi lintas halaman.

**Likely files:**
- Modify: `src/components/TasksView.tsx`
- Modify: `src/components/MaterialsView.tsx`
- Modify: `src/components/ReferencesView.tsx`
- Modify: `src/components/ScheduleView.tsx`
- Modify: `src/components/CalendarView.tsx`
- Modify: `src/App.css`

1. Gunakan pola header konsisten: judul, jumlah item, satu aksi utama.
2. Filter menjadi chips ringkas; opsi lanjutan masuk popover.
3. List row menampilkan judul + satu metadata utama; metadata lain muncul saat dibuka.
4. Aksi edit/hapus masuk menu konteks, bukan semua tampil sejajar.
5. Gabungkan fungsi yang tumpang tindih antara Jadwal dan Kalender; jika keduanya wajib, bedakan jelas: jadwal mingguan vs tenggat bulanan.
6. Hindari panel bersarang dan kartu di dalam kartu.

### Fase 6: Copilot dan Pengaturan

**Objective:** Membuat AI terasa sebagai alat, bukan dekorasi pusat aplikasi.

**Likely files:**
- Modify: `src/components/AIAssistantDrawer.tsx`
- Modify: `src/components/ModelPicker.tsx`
- Modify: `src/components/SettingsView.tsx`
- Modify: `src/App.css`

1. FAB cukup ikon + label `Copilot` saat perlu; hapus nama model dari FAB.
2. Nama model tetap tersedia di header drawer, bukan di seluruh aplikasi.
3. Kurangi quick prompts menjadi 3 tindakan yang benar-benar sering dipakai.
4. Hilangkan kalimat marketing seperti “AI pintar”; gunakan bahasa fungsional.
5. Pengaturan dibagi menjadi section yang dapat dibuka: `Profil`, `Tampilan`, `Data`, `AI`.
6. Tampilkan opsi teknis hanya di bagian AI; default collapse.
7. Status cloud normal disembunyikan; tampilkan spinner singkat saat simpan dan banner hanya saat gagal.

### Fase 7: Copy audit anti–AI slop

**Objective:** Menjadikan bahasa singkat, manusiawi, konsisten.

**Likely files:** Seluruh komponen tampilan; tanpa perubahan logika data.

1. Hapus teks yang mengulang heading.
2. Ganti jargon: `Pencarian AI` → `Hasil untuk`; `Ditambahkan melalui Copilot` → metadata sumber opsional atau hapus.
3. Gunakan kata kerja langsung: `Tambah tugas`, `Buka materi`, `Coba lagi`.
4. Hindari label kapital penuh kecuali status 1–2 kata.
5. Hindari klaim kosong: “cerdas”, “modern”, “powerful”, “otomatis” bila tidak memberi informasi.
6. Pertahankan pesan error yang menjelaskan dampak dan aksi pemulihan.

---

## Strategi pengerjaan

- Implementasi satu fase per persetujuan.
- Setiap fase: screenshot awal → perubahan minimal → build/lint/test → screenshot desktop/mobile → persetujuan → commit/push.
- Jangan mengubah data, Supabase, AI proxy, atau fitur premium dalam pekerjaan visual ini.
- Jangan menambah dependency desain.
- Jangan melakukan redesign besar sekaligus; sulit dibandingkan dan di-rollback.

## Tes dan validasi tiap fase

Run:
- `npm run build`
- `npm run lint`
- `npx tsc -b`
- seluruh `tests/*.mjs`

Manual:
- Desktop 1280×900 dan mobile 390×844.
- Light/dark mode.
- Keyboard navigation dan focus states.
- Sidebar/mobile nav, modal, Copilot, form, empty state.
- Tidak ada teks terpotong, horizontal overflow, atau FAB menutupi navigasi.

## Risiko dan keputusan yang perlu persetujuan

1. **Gaya visual:** rekomendasi `Notion-like warm minimal` dengan presisi Linear; bukan dashboard penuh warna.
2. **Navigasi:** menyembunyikan fitur sekunder dalam `Lainnya` menambah satu klik.
3. **Beranda:** rumus dekoratif dan kartu statistik besar direkomendasikan dihapus.
4. **Jadwal vs Kalender:** perlu diputuskan apakah dua halaman tetap terpisah.
5. **Copilot:** rekomendasi nama model dihapus dari FAB, tetap terlihat di drawer.

## Rekomendasi awal

Mulai hanya dari **Fase 1 + Fase 2 (fondasi visual dan Beranda)**. Dampak paling terlihat, risiko paling rendah, mudah dibandingkan sebelum menyentuh seluruh navigasi.