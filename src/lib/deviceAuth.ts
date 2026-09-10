/**
 * Mengatur otorisasi perangkat: membedakan HP Pribadi Ryan vs HP Orang Lain (Mama / Teman)
 */

const CURRENT_KEY = "kelasku_ryan_phone_auth_v3";

export function isOwnerDevice(): boolean {
  if (typeof window === "undefined") return false;
  // Bersihkan semua jejak kunci lama dari sesi uji coba sebelumnya
  localStorage.removeItem("kelasku_owner_device_status_v1");
  localStorage.removeItem("kelasku_owner_device_v1");
  return localStorage.getItem(CURRENT_KEY) === "true";
}

export function setAsOwnerDevice(status: boolean): void {
  if (typeof window === "undefined") return;
  if (status) {
    localStorage.setItem(CURRENT_KEY, "true");
  } else {
    localStorage.removeItem(CURRENT_KEY);
  }
}
