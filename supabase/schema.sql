-- ==============================================================================
-- SKEMA SUPABASE KELASKU
-- ==============================================================================
-- Jalankan di SQL Editor Supabase:
-- https://supabase.com/dashboard/project/huchjzarlnafnvrlmutg/sql
--
-- Aman dijalankan berulang kali (IF NOT EXISTS / DROP POLICY IF EXISTS).

-- 1. Tugas & deadline
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Materi & modul
CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Referensi & buku penunjang
CREATE TABLE IF NOT EXISTS public.references (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Catatan pertemuan per mata kuliah
--    Tabel ini sempat tertinggal sehingga pemuatan data cloud gagal total.
CREATE TABLE IF NOT EXISTS public.meeting_notes (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Pengaturan & profil (satu baris, id = 'profile')
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Izin akses
-- ------------------------------------------------------------------------------
-- PERINGATAN KEAMANAN: kebijakan di bawah membuka baca DAN tulis untuk siapa pun
-- yang memegang publishable key. Key itu ikut terkirim di dalam bundel JavaScript
-- aplikasi, jadi secara praktis publik. Selama kebijakan ini terpasang, siapa pun
-- yang membuka halaman dapat membaca dan mengubah seluruh data. Untuk data
-- perkuliahan pribadi ini mungkin dapat diterima, tetapi jika kelak ada data
-- yang tidak boleh dilihat orang lain, ganti dengan autentikasi Supabase dan
-- kebijakan berbasis auth.uid().

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-write tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public read-write materials" ON public.materials;
DROP POLICY IF EXISTS "Allow public read-write references" ON public.references;
DROP POLICY IF EXISTS "Allow public read-write meeting_notes" ON public.meeting_notes;
DROP POLICY IF EXISTS "Allow public read-write app_settings" ON public.app_settings;

CREATE POLICY "Allow public read-write tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write references" ON public.references FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write meeting_notes" ON public.meeting_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
