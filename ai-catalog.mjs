// Katalog model Copilot. Satu sumber untuk klien (label dropdown) dan server
// (allowlist + pemilihan kunci). Tidak ada kunci di sini, jadi aman ikut ke
// bundel browser.
//
// vendor menentukan env kunci mana yang dipakai proxy /api/chat/completions:
//   gorouter -> GOROUTER_API_KEY   xkiro -> XKIRO_API_KEY
//
// Semua model xkiro di bawah ini bertarif access_tier "free" dan sudah diuji
// benar-benar menjawab. Model berbayar sengaja tidak dimasukkan: kunci gratis
// ditolak upstream, jadi hanya jadi pilihan yang gagal.

export const VENDORS = {
  gorouter: { base: 'https://gorouter.app/v1', keyEnv: 'GOROUTER_API_KEY' },
  xkiro: { base: 'https://api.xkiro.com/v1', keyEnv: 'XKIRO_API_KEY' },
}

export const MODELS = [
  { id: 'claude-opus-5', label: 'Claude Opus 5', vendor: 'gorouter', note: 'Paling pintar' },
  { id: 'deepseek/deepseek-v4-pro', label: 'DeepSeek V4 Pro', vendor: 'xkiro', note: 'Penalaran kuat' },
  { id: 'deepseek/deepseek-v3.2', label: 'DeepSeek V3.2', vendor: 'xkiro', note: 'Ringkas dan cepat' },
  { id: 'qwen/qwen3.8-max:free', label: 'Qwen3.8 Max', vendor: 'xkiro', note: 'Konteks 1 juta token' },
  { id: 'qwen/qwen3.6-plus:free', label: 'Qwen3.6 Plus', vendor: 'xkiro', note: 'Seimbang' },
  { id: 'qwen/qwen3.5-flash:free', label: 'Qwen3.5 Flash', vendor: 'xkiro', note: 'Tercepat' },
  { id: 'qwen/qwen3-coder-plus:free', label: 'Qwen3 Coder Plus', vendor: 'xkiro', note: 'Untuk kode' },
  { id: 'minimax/minimax-m3', label: 'MiniMax M3', vendor: 'xkiro', note: 'Konteks 1 juta token' },
  { id: 'minimax/minimax-m2.7', label: 'MiniMax M2.7', vendor: 'xkiro', note: 'Penalaran' },
  { id: 'mistralai/mistral-large-2512', label: 'Mistral Large 3', vendor: 'xkiro', note: 'Rapi berbahasa' },
  { id: 'mistralai/mistral-medium-3.5', label: 'Mistral Medium 3.5', vendor: 'xkiro', note: 'Hemat' },
]

export const DEFAULT_MODEL = 'claude-opus-5'

/** Kembalikan entri katalog, atau null kalau id tidak dikenal. */
export const findModel = (id) => MODELS.find((m) => m.id === id) || null
