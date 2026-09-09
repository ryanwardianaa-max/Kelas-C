/**
 * Helper pembuatan URL QR Code dan kode pairing otorisasi Smart TV
 */

export function generatePairingCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // tanpa karakter ambigu seperti 0, 1, I, O
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getQrCodeImageUrl(content: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(content)}&margin=10`;
}
