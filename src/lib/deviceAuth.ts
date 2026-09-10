/**
 * Mengatur otorisasi perangkat: membedakan HP Pribadi Ryan vs HP Orang Lain (Mama / Teman)
 */

const OWNER_DEVICE_KEY = "kelasku_owner_device_status_v1";

export function isOwnerDevice(): boolean {
  if (typeof window === "undefined") return false;
  // Periksa apakah perangkat ini sudah ditandai sebagai HP/Laptop Pemilik (Ryan)
  return localStorage.getItem(OWNER_DEVICE_KEY) === "true";
}

export function setAsOwnerDevice(status: boolean): void {
  if (typeof window === "undefined") return;
  if (status) {
    localStorage.setItem(OWNER_DEVICE_KEY, "true");
  } else {
    localStorage.removeItem(OWNER_DEVICE_KEY);
  }
}
