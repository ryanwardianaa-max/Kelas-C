import {
  Cloud,
  Lock,
  RefreshCw,
  Unlock,
} from "./Icons";
import { useEffect, useState } from "react";
import { setAdminPin, verifyAdminPin } from "../lib/adminPin";
import { checkCloud, cloudConfigured, syncNow } from "../lib/supabase";
import ModelPicker from "./ModelPicker";
import type { AIProvider, UserSettings } from "../types";
export default function SettingsView({
  settings,
  setSettings,
  reload: _reload,
  onSynced,
}: {
  settings: UserSettings;
  setSettings: (s: UserSettings) => void;
  reload: () => void;
  onSynced?: (s: Awaited<ReturnType<typeof syncNow>>) => void;
}) {
  const [draft, setDraft] = useState(settings),
    [message, setMessage] = useState(""),
    [online, setOnline] = useState<boolean | null>(null),
    [syncing, setSyncing] = useState(false),
    [adminUnlocked, setAdminUnlocked] = useState(false),
    [pin, setPin] = useState(""),
    [newPin, setNewPinValue] = useState("");
  useEffect(() => {
    void checkCloud().then(setOnline);
  }, []);
  // Data cloud bisa tiba setelah halaman ini terbuka; ikuti nilai terbaru.
  useEffect(() => {
    setDraft(settings);
  }, [settings]);
  const save = () => {
      setSettings(draft);
      setMessage("");
    },
    unlock = async () => {
      if (await verifyAdminPin(pin)) {
        setAdminUnlocked(true);
        setPin("");
        setMessage("Akses admin dibuka untuk sesi ini.");
      } else setMessage("PIN salah.");
    },
    changePin = async () => {
      try {
        await setAdminPin(newPin);
        setNewPinValue("");
        setMessage("PIN admin berhasil diubah.");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "PIN gagal diubah.");
      }
    },
    sync = async () => {
      setSyncing(true);
      try {
        const data = await syncNow();
        onSynced?.(data);
        setOnline(true);
        setMessage("Sinkronisasi selesai.");
      } catch (e) {
        setOnline(false);
        setMessage(e instanceof Error ? e.message : "Sinkronisasi gagal.");
      } finally {
        setSyncing(false);
      }
    };
  return (
    <>
      <div className="page-title">
        <small>PREFERENSI</small>
        <h1>Pengaturan</h1>
        <p>
          Profil dan preferensi bersifat publik; konfigurasi sensitif memerlukan
          PIN.
        </p>
      </div>
      {message && <div className="toast" role="status" aria-live="polite">{message}</div>}
      <div className="settings-grid">
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <h2>Profil mahasiswa</h2>
          <label>
            Nama lengkap
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            NIM
            <input
              value={draft.nim}
              onChange={(e) => setDraft({ ...draft, nim: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
          </label>
          <div className="form-grid">
            <label>
              Program studi
              <input
                value={draft.program}
                onChange={(e) =>
                  setDraft({ ...draft, program: e.target.value })
                }
              />
            </label>
            <label>
              Semester
              <input
                value={draft.semester}
                onChange={(e) =>
                  setDraft({ ...draft, semester: e.target.value })
                }
              />
            </label>
            <label>
              Kelas
              <input
                value={draft.className}
                onChange={(e) =>
                  setDraft({ ...draft, className: e.target.value })
                }
              />
            </label>
          </div>
          <h2>Preferensi umum</h2>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.notifications}
              onChange={(e) =>
                setDraft({ ...draft, notifications: e.target.checked })
              }
            />{" "}
            Notifikasi
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.sound}
              onChange={(e) => setDraft({ ...draft, sound: e.target.checked })}
            />{" "}
            Suara pengingat
          </label>
          <button className="primary">Simpan profil & preferensi</button>
        </form>
        <section>
          {!adminUnlocked ? (
            <div className="panel admin-lock">
              <Lock />
              <h2>Bagian ini dikunci</h2>
              <p>
                Khusus Pemilik/Admin: AI, cloud, Supabase, dan PIN lokal.
              </p>
              <label>
                PIN Admin
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void unlock();
                  }}
                />
              </label>
              <button className="primary" onClick={() => void unlock()}>
                <Unlock /> Buka Kunci Akses
              </button>
              <small>
                PIN awal 1234. Proteksi ini bersifat lokal pada browser, bukan
                autentikasi server. Status buka kunci hanya bertahan selama
                komponen/sesi aplikasi aktif.
              </small>
            </div>
          ) : (
            <>
              <section className="panel">
                <div className="panel-head">
                  <h2>AI & Cloud</h2>
                  <button onClick={() => setAdminUnlocked(false)}>
                    <Lock /> Kunci Kembali
                  </button>
                </div>
                <label>
                  Provider
                  <select
                    value={draft.ai.provider}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        ai: {
                          ...draft.ai,
                          provider: e.target.value as AIProvider,
                        },
                      })
                    }
                  >
                    <option value="server">Server (kunci aman)</option>
                    <option value="local">9Router lokal</option>
                  </select>
                </label>
                <label>
                  Model server
                  <ModelPicker
                    value={draft.ai.serverModel}
                    onChange={(id) => setDraft({ ...draft, ai: { ...draft.ai, serverModel: id } })}
                  />
                </label>
                <label>
                  Endpoint lokal
                  <input
                    value={draft.ai.localEndpoint}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        ai: { ...draft.ai, localEndpoint: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  API key lokal
                  <input
                    type="password"
                    value={draft.ai.localKey}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        ai: { ...draft.ai, localKey: e.target.value },
                      })
                    }
                  />
                </label>
                <label>
                  Model lokal
                  <input
                    value={draft.ai.localModel}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        ai: { ...draft.ai, localModel: e.target.value },
                      })
                    }
                  />
                </label>
                <button className="primary" onClick={save}>
                  Simpan konfigurasi
                </button>
                <p className="warning">
                  Kunci API AI hanya disimpan di perangkat ini selama sesi berjalan dan tidak pernah dikirim ke Supabase. PIN admin juga tetap lokal.
                </p>
              </section>
              <section className="panel cloud-panel">
                <h2>
                  <Cloud /> Supabase Cloud
                </h2>
                <p className={online ? "status ok" : "status"}>
                  {cloudConfigured()
                    ? online
                      ? "Terhubung"
                      : "Belum terhubung"
                    : "Belum dikonfigurasi melalui environment"}
                </p>
                <button
                  disabled={syncing || !cloudConfigured()}
                  onClick={() => void sync()}
                >
                  <RefreshCw />{" "}
                  {syncing ? "Menyinkronkan…" : "Sinkronkan sekarang"}
                </button>
              </section>
              <section className="panel cloud-panel">
                <h2>Ubah PIN lokal</h2>
                <label>
                  PIN baru (4–12 digit)
                  <input
                    type="password"
                    inputMode="numeric"
                    value={newPin}
                    onChange={(e) => setNewPinValue(e.target.value)}
                  />
                </label>
                <button onClick={() => void changePin()}>Ubah PIN</button>
                <p>
                  <small>
                    PIN disimpan terpisah secara lokal sebagai hash SHA-256
                    bersalt. Ini mencegah pembacaan PIN secara kasat mata,
                    tetapi bukan pengganti akun/autentikasi server.
                  </small>
                </p>
              </section>
            </>
          )}
        </section>
      </div>
    </>
  );
}
