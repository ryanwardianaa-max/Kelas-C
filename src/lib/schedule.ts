import type { Course } from '../types'

/**
 * Jadwal kuliah selalu dalam Waktu Indonesia Barat. WIB tetap UTC+7 dan tidak
 * pernah memakai daylight saving, jadi konversinya cukup pergeseran tetap —
 * tanpa ini jadwal ikut bergeser saat zona waktu perangkat salah atau saat
 * halaman dibuka dari luar Indonesia.
 * ponytail: cukup selama jadwal hanya WIB; kalau kelak ada zona lain, ganti
 * dengan Intl.DateTimeFormat + timeZone per mata kuliah.
 */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

/** Bagian tanggal/jam "sekarang" menurut WIB, apa pun zona waktu perangkat. */
const wibParts = (now: Date) => {
  const w = new Date(now.getTime() + WIB_OFFSET_MS)
  return { year: w.getUTCFullYear(), month: w.getUTCMonth(), date: w.getUTCDate(), day: w.getUTCDay() }
}

/** Tanggal hari ini menurut WIB — dipakai kalender untuk menandai "hari ini". */
export const wibToday = (now = new Date()) => wibParts(now)

/** Saat pasti (UTC) dari jam dinding WIB pada hari terdekat berikutnya. */
export const atTime = (base: Date, day: number, time: string) => {
  const { year, month, date, day: today } = wibParts(base)
  const [h, m] = time.split(':').map(Number)
  const delta = (day - today + 7) % 7
  return new Date(Date.UTC(year, month, date + delta, h, m) - WIB_OFFSET_MS)
}

export interface ScheduleState { course: Course; start: Date; end: Date; ongoing: boolean; remaining: number }

export function getCurrentOrNext(courses: Course[], now = new Date()): ScheduleState {
  const options = courses.map(course => {
    let start = atTime(now, course.dayIndex, course.startTime)
    let end = atTime(now, course.dayIndex, course.endTime)
    if (end <= now) {
      start = new Date(start.getTime() + 7 * 86400000)
      end = new Date(end.getTime() + 7 * 86400000)
    }
    const ongoing = start <= now && now < end
    return { course, start, end, ongoing, remaining: ongoing ? end.getTime() - now.getTime() : start.getTime() - now.getTime() }
  })
  return options.sort((a, b) => Number(b.ongoing) - Number(a.ongoing) || a.remaining - b.remaining)[0]
}

export const countdown = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(total / 86400), h = Math.floor((total % 86400) / 3600), m = Math.floor((total % 3600) / 60), s = total % 60
  if (d) return [`${d} hari`, h && `${h} jam`, `${m} menit`].filter(Boolean).join(', ')
  if (h) return `${h} jam, ${m} menit`
  // Di bawah satu jam detiknya ikut ditampilkan supaya hitungan terasa hidup.
  return m ? `${m} menit, ${s} detik` : `${s} detik`
}

/** Tanggal selalu dinyatakan dalam WIB, bukan zona perangkat. */
export const formatDate = (d: Date) =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(d)

/** Jam dinding WIB, dipakai untuk menegaskan sumber waktu di layar. */
export const formatTimeWIB = (d: Date) =>
  new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(d)
