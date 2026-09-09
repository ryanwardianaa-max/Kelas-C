import { useEffect, useRef, useState } from "react";
import { Lock, Unlock, X } from "./Icons";
import { generatePairingCode, getQrCodeImageUrl } from "../lib/qrCode";
import { verifyAdminPin } from "../lib/adminPin";
import { extractFaceVector, hasFaceTemplate, saveFaceTemplate, verifyFace } from "../lib/faceBiometrics";
import { supabase } from "../lib/supabase";

export default function SecurityGateModal({
  isOpen,
  onUnlock,
  onClose,
  canDismiss = false,
}: {
  isOpen: boolean;
  onUnlock: () => void;
  onClose?: () => void;
  canDismiss?: boolean;
}) {
  const [tab, setTab] = useState<"qr" | "face" | "pin">("qr");

  // Tab 1: QR Barcode state
  const [pairingCode] = useState(() => generatePairingCode());
  const [qrStatus, setQrStatus] = useState<"waiting" | "approved">("waiting");

  // Tab 2: Face Biometric state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [faceMsg, setFaceMsg] = useState<string>("");
  const [faceMatchPercent, setFaceMatchPercent] = useState<number | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(() => hasFaceTemplate());

  // Tab 3: PIN state
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  // Success trigger
  const [unlockedNotice, setUnlockedNotice] = useState<string | null>(null);

  const triggerSuccess = (reason: string) => {
    setUnlockedNotice(reason);
    setTimeout(() => {
      onUnlock();
    }, 600);
  };

  // --- TAB 1: QR CODE REALTIME / POLLING ---
  useEffect(() => {
    if (!isOpen || tab !== "qr" || qrStatus === "approved") return;

    let subChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    if (supabase) {
      subChannel = supabase.channel(`auth_pair_${pairingCode}`);
      subChannel
        .on("broadcast", { event: "approved" }, () => {
          setQrStatus("approved");
          triggerSuccess("Smart TV Berhasil Diotorisasi via HP!");
        })
        .subscribe();
    }

    // Polling fallback via app_settings
    const interval = setInterval(async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("data")
          .eq("id", `auth_pair_${pairingCode}`)
          .maybeSingle();
        if (data?.data && (data.data as { approved?: boolean }).approved) {
          setQrStatus("approved");
          triggerSuccess("Smart TV Berhasil Diotorisasi via HP!");
        }
      } catch (_e) {
        // Polling error silent
      }
    }, 2500);

    return () => {
      clearInterval(interval);
      if (subChannel && supabase) {
        supabase.removeChannel(subChannel);
      }
    };
  }, [isOpen, tab, pairingCode, qrStatus]);

  // --- TAB 2: CAMERA LIFECYCLE ---
  useEffect(() => {
    if (!isOpen || tab !== "face") {
      stopCamera();
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen, tab]);

  const startCamera = async () => {
    try {
      setFaceMsg("Menghubungkan ke kamera depan...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
      setFaceMsg("Arahkan wajah Anda ke dalam lingkaran.");
    } catch (_e) {
      setStreamActive(false);
      setFaceMsg("Kamera tidak dapat diakses atau perangkat tidak memiliki kamera.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const s = videoRef.current.srcObject as MediaStream;
      s.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const handleRegisterFace = () => {
    if (!videoRef.current) return;
    const vec = extractFaceVector(videoRef.current);
    if (!vec) {
      setFaceMsg("Wajah belum terdeteksi. Pastikan pencahayaan cukup.");
      return;
    }
    saveFaceTemplate(vec);
    setIsEnrolled(true);
    setFaceMsg("Sampel wajah Ryan berhasil disimpan sebagai kunci biometrik!");
  };

  const handleScanFace = () => {
    if (!videoRef.current) return;
    const res = verifyFace(videoRef.current, 0.74);
    const pct = Math.min(100, Math.max(0, Math.round(res.score * 100)));
    setFaceMatchPercent(pct);
    if (res.match) {
      setFaceMsg(`Wajah Terverifikasi: Ryan Wardiana (${pct}% cocok)`);
      triggerSuccess("Verifikasi Wajah Berhasil!");
    } else {
      setFaceMsg(`Tingkat kemiripan ${pct}%. Belum memenuhi ambang batas.`);
    }
  };

  // --- TAB 3: PIN KEYPAD LOGIC ---
  const handlePinInput = async (digit: string) => {
    if (pin.length >= 6) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setPinError(false);

    if (nextPin.length === 6) {
      setPinLoading(true);
      const ok = await verifyAdminPin(nextPin);
      setPinLoading(false);
      if (ok) {
        triggerSuccess("PIN Valid!");
      } else {
        setPinError(true);
        setTimeout(() => setPin(""), 600);
      }
    }
  };

  const handlePinDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handlePinClear = () => {
    setPin("");
    setPinError(false);
  };

  // Keyboard shortcut listener for PIN
  useEffect(() => {
    if (!isOpen || tab !== "pin") return;
    const handleKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handlePinInput(e.key);
      } else if (e.key === "Backspace") {
        handlePinDelete();
      } else if (e.key === "Escape") {
        handlePinClear();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, tab, pin]);

  if (!isOpen) return null;

  const authUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?auth_pair=${pairingCode}&session=tv_gate`
    : "";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.88)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b, #0f172a)",
            color: "white",
            padding: "20px 24px",
            position: "relative",
          }}
        >
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: 0,
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <X />
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span
              style={{
                background: "rgba(99, 102, 241, 0.2)",
                color: "#818cf8",
                padding: "4px 8px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.74rem",
                fontWeight: 800,
                letterSpacing: "0.06em",
              }}
            >
              <Lock size={14} /> GERBANG KEAMANAN KELASKU
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Otorisasi Akses Kelas</h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#94a3b8" }}>
            Smart TV, Laptop &amp; Portal Presentasi Akademik
          </p>
        </div>

        {/* 3 Tab Navigasi Keamanan */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            background: "#f1f5f9",
            padding: "6px",
            gap: "4px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <button
            type="button"
            onClick={() => setTab("qr")}
            style={{
              padding: "10px 6px",
              border: 0,
              borderRadius: "8px",
              background: tab === "qr" ? "white" : "transparent",
              color: tab === "qr" ? "#0f172a" : "#64748b",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
              boxShadow: tab === "qr" ? "0 2px 5px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <span>📱 Barcode</span>
            <small style={{ fontSize: "0.68rem", opacity: 0.8, color: "#16a34a" }}>Smart TV</small>
          </button>
          <button
            type="button"
            onClick={() => setTab("face")}
            style={{
              padding: "10px 6px",
              border: 0,
              borderRadius: "8px",
              background: tab === "face" ? "white" : "transparent",
              color: tab === "face" ? "#0f172a" : "#64748b",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
              boxShadow: tab === "face" ? "0 2px 5px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <span>👤 Wajah</span>
            <small style={{ fontSize: "0.68rem", opacity: 0.8 }}>Biometrik</small>
          </button>
          <button
            type="button"
            onClick={() => setTab("pin")}
            style={{
              padding: "10px 6px",
              border: 0,
              borderRadius: "8px",
              background: tab === "pin" ? "white" : "transparent",
              color: tab === "pin" ? "#0f172a" : "#64748b",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer",
              boxShadow: tab === "pin" ? "0 2px 5px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <span>🔢 PIN</span>
            <small style={{ fontSize: "0.68rem", opacity: 0.8 }}>6 Digit</small>
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: "22px", textAlign: "center", minHeight: "330px" }}>
          {unlockedNotice ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "260px",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Unlock size={32} />
              </div>
              <h3 style={{ margin: 0, color: "#166534" }}>{unlockedNotice}</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Membuka portal akademik...</p>
            </div>
          ) : tab === "qr" ? (
            <div>
              <p style={{ margin: "0 0 14px", fontSize: "0.86rem", color: "#475569" }}>
                Scan QR Code ini menggunakan kamera <b>HP Ryan</b> untuk membuka Smart TV secara instan.
              </p>
              <div
                style={{
                  display: "inline-block",
                  padding: "10px",
                  background: "white",
                  borderRadius: "14px",
                  border: "2px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
              >
                <img
                  src={getQrCodeImageUrl(authUrl, 180)}
                  alt="QR Code Login"
                  style={{ width: "180px", height: "180px", display: "block", borderRadius: "8px" }}
                />
              </div>
              <div style={{ marginTop: "14px" }}>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Atau masukkan Kode Pairing di HP:</span>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 900,
                    letterSpacing: "0.25em",
                    color: "#3b82f6",
                    fontFamily: "monospace",
                    margin: "4px 0",
                  }}
                >
                  {pairingCode}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "12px",
                  fontSize: "0.8rem",
                  color: "#059669",
                  background: "#ecfdf5",
                  padding: "7px 12px",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "inline-block",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                Menunggu otorisasi HP Ryan...
              </div>
              {/* Shortcut Uji Coba Cepat */}
              <button
                type="button"
                onClick={() => {
                  triggerSuccess("Simulasi Otorisasi HP Berhasil!");
                }}
                style={{
                  marginTop: "12px",
                  padding: "6px 12px",
                  fontSize: "0.75rem",
                  background: "transparent",
                  color: "#64748b",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                ⚡ Uji Coba: Simulasikan Otorisasi HP
              </button>
            </div>
          ) : tab === "face" ? (
            <div>
              <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "#475569" }}>
                Verifikasi biometrik wajah untuk akses melalui HP pinjaman / webcam.
              </p>
              <div
                style={{
                  position: "relative",
                  width: "180px",
                  height: "180px",
                  margin: "0 auto 12px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid #6366f1",
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.25)",
                  background: "#000",
                }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)", // Mirror selfie view
                  }}
                />
                {streamActive && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      border: "2px dashed rgba(255,255,255,0.6)",
                      borderRadius: "50%",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
              <p style={{ fontSize: "0.82rem", color: "#334155", minHeight: "22px", margin: "4px 0 12px" }}>
                {faceMsg}
                {faceMatchPercent !== null && ` (Kecocokan: ${faceMatchPercent}%)`}
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleScanFace}
                  disabled={!streamActive}
                  style={{
                    padding: "9px 16px",
                    background: "#4f46e5",
                    color: "white",
                    border: 0,
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: streamActive ? "pointer" : "not-allowed",
                    opacity: streamActive ? 1 : 0.6,
                  }}
                >
                  Pindai Wajah
                </button>
                <button
                  type="button"
                  onClick={handleRegisterFace}
                  disabled={!streamActive}
                  style={{
                    padding: "9px 14px",
                    background: "#f1f5f9",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    cursor: streamActive ? "pointer" : "not-allowed",
                  }}
                >
                  {isEnrolled ? "Rekam Ulang Wajah" : "Daftarkan Wajah"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "#475569" }}>
                Masukkan 6 Digit PIN Pengaman (Default: <b>232151</b>)
              </p>

              {/* PIN Indicator Circles */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "12px",
                  margin: "12px 0 18px",
                }}
              >
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <span
                      key={idx}
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        border: pinError ? "2px solid #ef4444" : "2px solid #64748b",
                        background: pinError ? "#fee2e2" : filled ? "#0f172a" : "transparent",
                        transition: "all 0.15s ease",
                      }}
                    />
                  );
                })}
              </div>
              {pinError && (
                <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: "0 0 8px", fontWeight: 700 }}>
                  PIN Salah. Silakan coba kembali.
                </p>
              )}

              {/* On-Screen Touch Keypad */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                  maxWidth: "240px",
                  margin: "0 auto",
                }}
              >
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => {
                      if (btn === "C") handlePinClear();
                      else if (btn === "⌫") handlePinDelete();
                      else handlePinInput(btn);
                    }}
                    disabled={pinLoading}
                    style={{
                      height: "46px",
                      fontSize: btn === "⌫" || btn === "C" ? "0.95rem" : "1.2rem",
                      fontWeight: 700,
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      background: btn === "C" ? "#fee2e2" : btn === "⌫" ? "#f1f5f9" : "white",
                      color: btn === "C" ? "#b91c1c" : "#0f172a",
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            background: "#f8fafc",
            padding: "10px 20px",
            borderTop: "1px solid #e2e8f0",
            fontSize: "0.74rem",
            color: "#64748b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Ryan Wardiana · NIM 232151098</span>
          <span style={{ color: "#16a34a", fontWeight: 700 }}>Status: Aman</span>
        </div>
      </div>
    </div>
  );
}
