import type { Course } from '../types'
export const COURSE_SCHEDULE: Course[] = [
{id:1,code:'KP21517003',name:'Analisis Kompleks',sks:2,dayIndex:1,dayName:'Senin',startTime:'07:00',endTime:'08:40',room:'C.1.3',lecturer:'Vepi Apiati, S.Pd., M.Pd.',color:'#6558df',topics:['Bilangan Kompleks','Fungsi Analitik','Persamaan Cauchy-Riemann','Integral Kontur']},
{id:2,code:'KP21517006',name:'Seminar Pendidikan Matematika',sks:3,dayIndex:1,dayName:'Senin',startTime:'09:35',endTime:'12:05',room:'MAT-1',lecturer:'Dr. Nani Ratnaningsih, M.Pd.',color:'#ee9250',topics:['Kajian Artikel Jurnal','Proposal Penelitian','Metodologi Pendidikan Mat','Presentasi Seminar']},
{id:3,code:'KP21517001',name:'Metode Numerik',sks:3,dayIndex:3,dayName:'Rabu',startTime:'15:05',endTime:'17:35',room:'K.D.2.4',lecturer:'Elis Nurhayati, M.Pd.',color:'#279b72',topics:['Analisis Galat','Pencarian Akar','Sistem Persamaan Linier','Integrasi Numerik']},
{id:4,code:'KP21517004',name:'Analisis Real',sks:2,dayIndex:4,dayName:'Kamis',startTime:'07:00',endTime:'08:40',room:'K.D.2.4',lecturer:'Linda Herawati, S.Pd., M.Pd.',color:'#db5874',topics:['Sifat Aljabar & Kelengkapan Real','Topologi Bilangan Real','Barisan & Limit Epsilon-Delta','Kekontinuan & Turunan']},
{id:5,code:'KP21517007',name:'Matematika Ekonomi',sks:3,dayIndex:4,dayName:'Kamis',startTime:'09:35',endTime:'12:05',room:'C.3.1',lecturer:'Vepi Apiati, S.Pd., M.Pd.',color:'#438bd2',topics:['Fungsi Permintaan & Penawaran','Keseimbangan Pasar','Elastisitas','Optimasi Biaya & Laba']},
{id:6,code:'KF21518001',name:'Skripsi',sks:6,dayIndex:0,dayName:'Minggu',startTime:'06:00',endTime:'16:00',room:'FKIP / Sekolah Mitra',lecturer:'Satya Santika, S.Pd., M.Pd.',color:'#9564bf',topics:['Penyusunan BAB 1-5','Pengembangan Instrumen LKPD','Validasi Ahli & Uji Coba','Analisis Data & Sidang']}
]
export const courseName=(code:string)=>COURSE_SCHEDULE.find(c=>c.code===code)?.name??'Umum'
