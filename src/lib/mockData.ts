import type { Course,SyllabusMeeting } from '../types'
export const COURSE_SCHEDULE: Course[] = [
{id:1,code:'KP21517003',name:'Analisis Kompleks',sks:2,dayIndex:1,dayName:'Senin',startTime:'07:00',endTime:'08:40',room:'C.1.3',lecturer:'Vepi Apiati, S.Pd., M.Pd.',color:'#6558df',topics:['Bilangan Kompleks','Fungsi Analitik','Persamaan Cauchy-Riemann','Integral Kontur']},
{id:2,code:'KP21517006',name:'Seminar Pendidikan Matematika',sks:3,dayIndex:1,dayName:'Senin',startTime:'09:35',endTime:'12:05',room:'MAT-1',lecturer:'Dr. Nani Ratnaningsih, M.Pd.',color:'#ee9250',topics:['Kajian Artikel Jurnal','Proposal Penelitian','Metodologi Pendidikan Matematika','Presentasi Seminar']},
{id:3,code:'KP21517001',name:'Metode Numerik',sks:3,dayIndex:3,dayName:'Rabu',startTime:'15:05',endTime:'17:35',room:'K.D.2.4',lecturer:'Linda Herawati, S.Pd., M.Pd.',color:'#279b72',topics:['Analisis Galat','Pencarian Akar','Sistem Persamaan Linier','Integrasi Numerik']},
{id:4,code:'KP21517004',name:'Analisis Real',sks:2,dayIndex:4,dayName:'Kamis',startTime:'07:00',endTime:'08:40',room:'K.D.2.4',lecturer:'Linda Herawati, S.Pd., M.Pd.',color:'#db5874',topics:['Kelengkapan Real','Topologi Bilangan Real','Barisan dan Limit','Integral Riemann']},
{id:5,code:'KP21517007',name:'Matematika Ekonomi',sks:3,dayIndex:4,dayName:'Kamis',startTime:'09:35',endTime:'12:05',room:'C.3.1',lecturer:'Vepi Apiati, S.Pd., M.Pd.',color:'#438bd2',topics:['Permintaan dan Penawaran','Keseimbangan Pasar','Optimasi','Input-Output']},
{id:6,code:'KF21518001',name:'Skripsi',sks:6,dayIndex:0,dayName:'Minggu',startTime:'06:00',endTime:'16:00',room:'FKIP / Sekolah Mitra',lecturer:'Satya Santika, S.Pd., M.Pd.',color:'#9564bf',topics:['Proposal','Pengumpulan Data','Analisis Data','Sidang dan Publikasi']}
]
/* Silabus di bawah ini HANYA memuat pertemuan yang punya bukti di arsip mata
   kuliah (catatan kuliah, foto papan tulis, atau halaman bahan belajar di
   public/materi). Tidak ada RPS resmi dari dosen, jadi pertemuan tanpa bukti
   ditandai "(Belum diisi)" alih-alih diisi judul karangan. */
const blank=(from:number,to:number):SyllabusMeeting[]=>Array.from({length:to-from+1},(_,i)=>({meeting:from+i,title:`Pertemuan ${String(from+i).padStart(2,'0')} (Belum diisi)`,kind:'Teori' as const,summary:'Belum ada catatan atau bahan materi yang terverifikasi.',activity:'Isi setelah materi perkuliahan diketahui.'}))
const analisisRealMeetings:SyllabusMeeting[]=[
{meeting:1,title:'Pertemuan 01 (Belum diisi)',kind:'Teori',summary:'Belum ada catatan atau bahan materi yang terverifikasi.',activity:'Isi setelah materi perkuliahan diketahui.'},
{meeting:2,title:'Landasan Himpunan dan Teorema De Morgan',kind:'Teori',summary:'Notasi kuantor, operasi himpunan, himpunan kosong, dan Teorema De Morgan.',activity:'Membaca definisi, diagram Venn, dan pembuktian formal.'},
{meeting:3,title:'Teorema De Morgan, Inklusi Ganda, dan Aljabar Himpunan',kind:'Teori',summary:'Pembuktian Teorema 1.1.4 Bartle dengan inklusi ganda dan rantai ekuivalensi.',activity:'Menelaah catatan kuliah dan dokumentasi catatan asli.'},
{meeting:4,title:'Sifat Terurut Baik dan Prinsip Induksi Matematika',kind:'Teori',summary:'Bartle 1.2.1–1.2.2: Sifat Terurut Baik, prinsip induksi, pembuktian, dan latihan nomor 4.',activity:'Mengikuti bukti kontradiksi dan menyusun bukti induksi langkah demi langkah.'},
{meeting:5,title:'Bahan Baca: Induksi dari Basis Tertentu dan Contoh (Bartle 1.2.3–1.2.4)',kind:'Teori',summary:'Materi persiapan, belum diklaim sebagai catatan kuliah: induksi mulai n₀ dan contoh penerapan.',activity:'Baca sebagai persiapan pertemuan berikutnya.'},
{meeting:6,title:'Bahan Baca: Induksi Kuat (Bartle 1.2.5)',kind:'Teori',summary:'Materi persiapan, belum diklaim sebagai catatan kuliah: prinsip induksi kuat dan faktorisasi prima.',activity:'Baca sebagai persiapan pertemuan berikutnya.'},
{meeting:7,title:'Bahan Baca: Himpunan Berhingga dan Tak Hingga (Bartle 1.3)',kind:'Teori',summary:'Materi persiapan, belum diklaim sebagai catatan kuliah: berhingga, terhitung, dan tak terhitung.',activity:'Baca sebagai persiapan setelah Section 1.2 selesai.'},
...blank(8,16)
]
const analisisKompleksMeetings:SyllabusMeeting[]=[
{meeting:1,title:'Pertemuan 01 (Libur / penyesuaian jadwal)',kind:'Teori',summary:'Catatan Pertemuan 03 mencatat pertemuan 1 dan 2 sebagai libur atau penyesuaian jadwal awal perkuliahan.',activity:'Tidak ada materi yang tercatat.'},
{meeting:2,title:'Pertemuan 02 (Libur / penyesuaian jadwal)',kind:'Teori',summary:'Catatan Pertemuan 03 mencatat pertemuan 1 dan 2 sebagai libur atau penyesuaian jadwal awal perkuliahan.',activity:'Tidak ada materi yang tercatat.'},
{meeting:3,title:'Pengantar Sistem Bilangan Kompleks, Sekawan, dan Operasi Aljabar Dasar',kind:'Teori',summary:'Bentuk z = a + bi, bagian real dan imajiner, hirarki sistem bilangan, konjugat, serta operasi aljabar dasar.',activity:'Menelaah catatan kuliah beserta foto catatan asli tiga lembar.'},
{meeting:4,title:'Sifat Operasi Dasar, Bilangan Sekawan, dan Nilai Mutlak',kind:'Teori',summary:'Ketertutupan, komutatif, asosiatif, sifat konjugat ganda, dan nilai mutlak. Catatan mentah hasil foto papan tulis; papan berhenti di sifat asosiatif.',activity:'Mencocokkan catatan papan tulis dengan bukti tertulis dan melengkapi bagian yang terpotong.'},
{meeting:5,title:'Modulus, Bidang Argand, Bentuk Polar, dan Rumus De Moivre',kind:'Teori',summary:'Bahan baca mandiri (bukan catatan kuliah): arti gambar dari |z|, bidang Argand, bentuk polar, dan De Moivre. Rujukan Brown & Churchill Bab 1 §5–§10.',activity:'Baca sebagai lanjutan Pertemuan 04, lalu cocokkan dengan materi kuliah.'},
...blank(6,16)
]
const seminarMeetings:SyllabusMeeting[]=[
{meeting:1,title:'Kontrak Kuliah, Visi-Misi, dan Alur Materi Perkuliahan',kind:'Teori',summary:'Kontrak perkuliahan, visi-misi UNSIL/FKIP/Jurusan, empat pilar materi, serta standar sumber rujukan (buku akademik, SINTA 1–4, jurnal internasional bereputasi).',activity:'Mencatat aturan perkuliahan dan mendaftar portal jurnal resmi yang direkomendasikan.'},
{meeting:2,title:'Lima Pergeseran Paradigma Riset dan Tujuh Rumpun Kajian',kind:'Teori',summary:'Pergeseran dari "apakah berpengaruh" ke "bagaimana dan mengapa", dari produk akhir ke lintasan belajar, serta tujuh rumpun kajian pendidikan matematika dan syarat kebaruan skripsi.',activity:'Memetakan rencana penelitian sendiri ke salah satu rumpun kajian.'},
{meeting:3,title:'Keselarasan Rumusan Masalah dengan Desain Penelitian',kind:'Teori',summary:'Matriks pasangan rumusan masalah dan desain (deskriptif, korelasional, eksperimen, kualitatif, PTK, R&D, design research), pola corong latar belakang, dan syarat kelayakan.',activity:'Menguji rumusan masalah sendiri terhadap matriks keselarasan.'},
{meeting:4,title:'Penelusuran Literatur, Tingkatan Sitasi, dan APA Edisi ke-7',kind:'Teori',summary:'Tiga tingkatan pengutipan (kutipan langsung, parafrasa, sintesis) dan dua perubahan APA 7: kota terbit dihapus, "dkk." sejak sitasi pertama.',activity:'Mengubah kutipan langsung pada draf menjadi parafrasa dan sintesis.'},
{meeting:5,title:'Pertemuan 05 (Belum diisi)',kind:'Teori',summary:'Belum ada catatan atau bahan materi yang terverifikasi.',activity:'Isi setelah materi perkuliahan diketahui.'},
{meeting:6,title:'Enam Kasus Salah Pasang Rumusan Masalah dan Desain',kind:'Teori',summary:'Enam kesalahan metodologis tersering beserta desain yang seharusnya dipakai, ditutup dengan pemeriksaan anti-salah-pasang untuk judul skripsi sendiri.',activity:'Memeriksa kesesuaian rumusan masalah dan desain R&D pada rencana skripsi.'},
{meeting:7,title:'Pertemuan 07 (Belum diisi)',kind:'Teori',summary:'Belum ada catatan atau bahan materi yang terverifikasi.',activity:'Isi setelah materi perkuliahan diketahui.'},
{meeting:8,title:'Paradigma Penelitian Kualitatif dan Empat Kriteria Keabsahan Data',kind:'Teori',summary:'Empat karakteristik penelitian kualitatif (latar alamiah, peneliti sebagai instrumen, deskriptif, analisis induktif) dan empat kriteria keabsahan Lincoln & Guba.',activity:'Menyiapkan rencana triangulasi dan member check untuk data lapangan.'},
{meeting:9,title:'Metodologi R&D: Kriteria Nieveen dan Evaluasi Formatif Tessmer',kind:'Teori',summary:'Tiga kriteria kualitas produk (validitas, kepraktisan, keefektifan) beserta penilainya, dan lima tahap evaluasi formatif dari evaluasi diri hingga uji lapangan.',activity:'Menyusun alur uji coba produk berjenjang untuk skripsi R&D.'},
{meeting:10,title:'Design Research dan Hypothetical Learning Trajectory',kind:'Teori',summary:'Tiga komponen wajib HLT (tujuan belajar, rangkaian aktivitas, dugaan pemikiran siswa) dan pembeda HLT dari RPP biasa, dengan contoh konteks etnomatematika anyaman mendong.',activity:'Menyusun satu baris matriks HLT untuk topik yang dipilih.'},
{meeting:11,title:'Pendataan Judul Rencana Penelitian Skripsi',kind:'Teori',summary:'Pendataan judul rencana penelitian tiap mahasiswa oleh dosen. Judul yang disetorkan mengikuti dokumen NUIR 2026.',activity:'Menyetorkan judul rencana penelitian skripsi.'},
...blank(12,16)
]
/* Metode Numerik: belum ada satu pun catatan kuliah di arsip mata kuliah.
   Enam belas judul berikut diambil dari halaman bahan belajar yang memang ada
   di public/materi/KP21517001 — bahan belajar mandiri, bukan catatan kuliah. */
const metodeNumerikMeetings:SyllabusMeeting[]=['Pengantar Metode Numerik','Deret Taylor dan Analisis Galat','Metode Tertutup untuk Akar Persamaan','Metode Terbuka untuk Akar Persamaan','Perbandingan Metode Pencarian Akar dan Laju Konvergensi','Eliminasi Gaussian dan Gauss–Jordan','Faktorisasi LU, Invers Matriks, dan Pivoting','Iterasi Jacobi, Gauss–Seidel, dan Konvergensi','Interpolasi Polinom Lagrange','Beda Terbagi Newton, Gambaran Spline, dan Perbedaan Regresi','Diferensiasi Numerik: Maju, Mundur, Pusat, dan Galat','Integrasi Numerik Komposit: Trapesium dan Aturan Simpson','Kuadratur Gauss: Integrasi Efisien, Galat, dan Pemilihan Metode','Masalah Nilai Awal PDB: Metode Euler dan Heun','Runge–Kutta Orde Empat untuk Persamaan Tunggal dan Sistem','Tinjauan Akhir: Peta Metode dan Alur Pemilihan'].map((title,i)=>({meeting:i+1,title,kind:'Teori' as const,summary:`Bahan belajar mandiri (bukan catatan kuliah): ${title.toLowerCase()}. Disusun mengacu pada buku Metode Numerik karya Rinaldi Munir.`,activity:'Baca bahan belajar, lalu cocokkan dengan materi kuliah setelah pertemuan berlangsung.'}))
const matematikaEkonomiMeetings:SyllabusMeeting[]=[
{meeting:1,title:'Pertemuan 01 (Belum diisi)',kind:'Teori',summary:'Belum ada catatan atau bahan materi yang terverifikasi.',activity:'Isi setelah materi perkuliahan diketahui.'},
{meeting:2,title:'Fungsi Permintaan, Fungsi Penawaran, dan Keseimbangan Pasar',kind:'Teori',summary:'Hukum permintaan dan penawaran, bentuk linier Qd = a − bP, kasus khusus kurva ekstrim, serta keseimbangan pasar. Konvensi: sumbu horizontal Q, vertikal P. Kamis, 20 Agustus 2026.',activity:'Menelaah catatan kuliah beserta grafik tulis tangan dan contoh sehari-hari.'},
{meeting:3,title:'Pajak, Subsidi, dan Keseimbangan Pasar Dua Macam Barang',kind:'Teori',summary:'Membentuk fungsi dari dua titik, keseimbangan pasar, pajak spesifik dan proporsional, subsidi, pembagian beban pajak konsumen-produsen, serta pasar dua macam barang. Kamis, 27 Agustus 2026.',activity:'Mengerjakan hitungan dari transkripsi sepuluh foto catatan tulis tangan.'},
{meeting:4,title:'Fungsi Biaya, Penerimaan, Laba, dan Titik Impas',kind:'Teori',summary:'Biaya tetap, variabel, total, rata-rata, dan marginal; penerimaan total; fungsi laba; serta titik impas (BEP). Kamis, 03 September 2026.',activity:'Mengikuti contoh soal lalu mengerjakan latihan biaya-penerimaan-laba.'},
...blank(5,16)
]
/* Skripsi: tahapan diambil dari berkas yang benar-benar ada di folder skripsi
   (Form NUIR 2026, draf proposal, revisi bimbingan pertama, studi pendahuluan,
   surat izin penelitian). Tahap yang belum berjalan ditandai sebagai rencana. */
const skripsiMeetings:SyllabusMeeting[]=[
{meeting:1,title:'Pengajuan Judul (Form NUIR 2026)',kind:'Tahap Riset',summary:'Judul terdaftar: Pengembangan Web Application Berbasis Generative Artificial Intelligence untuk Menghasilkan LKPD Matematika Berdiferensiasi Berdasarkan Asesmen Diagnostik.',activity:'Form NUIR 2026 tersimpan di folder administrasi dan persyaratan.'},
{meeting:2,title:'Penyusunan Draf Proposal BAB 1–3',kind:'Tahap Riset',summary:'Draf pendahuluan serta landasan teoretis dan prosedur penelitian tersusun, didukung berkas jurnal acuan dan berkas bibliografi.',activity:'Menulis dan merapikan draf proposal beserta daftar rujukan.'},
{meeting:3,title:'Bimbingan Pertama dan Revisi Proposal',kind:'Tahap Riset',summary:'Bimbingan pertama sudah berjalan; hasil revisi tersimpan sebagai berkas proposal revisi bimbingan pertama.',activity:'Menindaklanjuti masukan pembimbing pada draf proposal.'},
{meeting:4,title:'Studi Pendahuluan dan Perizinan Sekolah Mitra',kind:'Tahap Riset',summary:'Studi pendahuluan bersama guru matematika serta pengurusan izin penelitian di SMPN 3 Tasikmalaya.',activity:'Mengumpulkan data awal lapangan dan menyiapkan berkas perizinan.'},
{meeting:5,title:'Rencana: Seminar Proposal',kind:'Tahap Riset',summary:'Tahap rencana, belum berjalan.',activity:'Isi setelah jadwal seminar proposal diketahui.'},
{meeting:6,title:'Rencana: Pengambilan Data dan Penyusunan BAB 4–5',kind:'Tahap Riset',summary:'Tahap rencana, belum berjalan.',activity:'Isi setelah pengambilan data dimulai.'},
{meeting:7,title:'Rencana: Sidang Munaqasyah dan Publikasi',kind:'Tahap Riset',summary:'Tahap rencana, belum berjalan.',activity:'Isi setelah jadwal sidang diketahui.'}
]
export const SYLLABUS:Record<string,SyllabusMeeting[]>={
KP21517003:analisisKompleksMeetings,
KP21517006:seminarMeetings,
KP21517001:metodeNumerikMeetings,
KP21517004:analisisRealMeetings,
KP21517007:matematikaEkonomiMeetings,
KF21518001:skripsiMeetings
}
export const courseName=(code:string)=>COURSE_SCHEDULE.find(c=>c.code===code)?.name??'Umum'
