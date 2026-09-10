import { useEffect, useRef, useState } from "react";
import { X } from "./Icons";
import { generatePairingCode, getQrCodeImageUrl } from "../lib/qrCode";
import { verifyAdminPin } from "../lib/adminPin";
import { supabase } from "../lib/supabase";
import {
  compareFaceVectors,
  extractFaceVector,
  fetchFaceTemplateFromCloud,
  hasFaceTemplate,
  syncFaceTemplateToCloud,
} from "../lib/faceBiometrics";
import { isOwnerDevice, setAsOwnerDevice } from "../lib/deviceAuth";

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
  const [tab, setTab] = useState<"qr" | "face" | "pin">(() => {
    // Pada HP orang lain, default langsung ke PIN
    return isOwnerDevice() ? "qr" : "pin";
  });

  const [isOwner, setIsOwner] = useState(() => isOwnerDevice());

  // Device detection
  const [isMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 768 || "ontouchstart" in window;
  });

  // Tab 1: Barcode state
  const [pairingCode] = useState(() => generatePairingCode());
  const [qrStatus, setQrStatus] = useState<"waiting" | "approved">("waiting");
  const [manualCodeInput, setManualCodeInput] = useState("");
  const [mobileAuthMsg, setMobileAuthMsg] = useState("");
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);

  // Tab 2: Face Biometric state
  const faceVideoRef = useRef<HTMLVideoElement | null>(null);
  const [faceStreamActive, setFaceStreamActive] = useState(false);
  const [faceTemplate, setFaceTemplate] = useState<Float32Array | null>(null);
  const [faceStatusText, setFaceStatusText] = useState<string>("Menyiapkan kamera...");
  const [faceMatchScore, setFaceMatchScore] = useState<number | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState<string | null>(null);
  const consecutiveMatchRef = useRef(0);

  // Tab 3: PIN state
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const triggerSuccess = (label: string) => {
    setVerifiedSuccess(label);
    setTimeout(() => {
      onUnlock();
    }, 700);
  };

  // Muat template wajah dari local/cloud saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    fetchFaceTemplateFromCloud().then((tmpl) => {
      if (mounted && tmpl) {
        setFaceTemplate(tmpl);
      }
    });
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // --- TAB 1: SMART TV PAIRING LISTENER (HANYA DI LAYAR BESAR / TV) ---
  useEffect(() => {
    if (!isOpen || tab !== "qr" || qrStatus === "approved") return;

    let subChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;
    if (supabase) {
      subChannel = supabase.channel(`auth_pair_${pairingCode}`);
      subChannel
        .on("broadcast", { event: "approved" }, () => {
          setQrStatus("approved");
          triggerSuccess("Smart TV Berhasil Diotorisasi!");
        })
        .subscribe();
    }

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
          triggerSuccess("Smart TV Berhasil Diotorisasi!");
        }
      } catch (_e) {}
    }, 2000);

    return () => {
      clearInterval(interval);
      if (subChannel && supabase) {
        supabase.removeChannel(subChannel);
      }
    };
  }, [isOpen, tab, pairingCode, qrStatus]);

  // --- TAB 1 (HP RYAN): KAMERA PEMINDAI BARCODE TV ---
  useEffect(() => {
    if (!isOpen || tab !== "qr" || !isMobile || !isOwner) {
      if (scannerVideoRef.current?.srcObject) {
        const s = scannerVideoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
        scannerVideoRef.current.srcObject = null;
      }
      return;
    }

    let active = true;
    let stream: MediaStream | null = null;

    const startScanner = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (scannerVideoRef.current) {
          scannerVideoRef.current.srcObject = stream;
          await scannerVideoRef.current.play();
        }

        if ("BarcodeDetector" in window) {
          const detector = new (window as unknown as {
            BarcodeDetector: new (opts: { formats: string[] }) => {
              detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
            };
          }).BarcodeDetector({ formats: ["qr_code"] });

          const scanLoop = async () => {
            if (!active || !scannerVideoRef.current) return;
            try {
              if (scannerVideoRef.current.readyState >= 2) {
                const barcodes = await detector.detect(scannerVideoRef.current);
                if (barcodes.length > 0) {
                  const val = barcodes[0].rawValue;
                  const match = val.match(/auth_pair=([A-Z0-9]{6})/i);
                  if (match) {
                    await approveCode(match[1].toUpperCase());
                    return;
                  }
                }
              }
            } catch (_err) {}
            if (active) requestAnimationFrame(scanLoop);
          };
          scanLoop();
        }
      } catch (_err) {
        setMobileAuthMsg("Kamera tidak tersedia. Ketik 6 huruf kode TV di bawah.");
      }
    };

    startScanner();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (scannerVideoRef.current?.srcObject) {
        const s = scannerVideoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
        scannerVideoRef.current.srcObject = null;
      }
    };
  }, [isOpen, tab, isMobile, isOwner]);

  const approveCode = async (targetCode: string) => {
    if (!targetCode || targetCode.length < 6) return;
    if (!isOwner) {
      setMobileAuthMsg("Akses ditolak: Hanya HP Pemilik (Ryan) yang dapat mengotorisasi TV.");
      return;
    }
    setMobileAuthMsg(`Mengotorisasi Smart TV (${targetCode})...`);
    if (supabase) {
      try {
        const channel = supabase.channel(`auth_pair_${targetCode}`);
        channel.subscribe(async (st: string) => {
          if (st === "SUBSCRIBED") {
            await channel.send({
              type: "broadcast",
              event: "approved",
              payload: { by: "HP Ryan", at: new Date().toISOString() },
            });
          }
        });
        await supabase.from("app_settings").upsert({
          id: `auth_pair_${targetCode}`,
          data: { approved: true, at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        });
      } catch (_e) {}
    }
    triggerSuccess(`Smart TV (${targetCode}) Berhasil Diotorisasi!`);
  };

  // --- TAB 2: VERIFIKASI WAJAH BIOMETRIK ASLI (STRICT RECOGNITION) ---
  useEffect(() => {
    if (!isOpen || tab !== "face") {
      stopFaceCamera();
      return;
    }

    let active = true;
    consecutiveMatchRef.current = 0;
    setFaceStatusText("Mendeteksi wajah...");
    setFaceMatchScore(null);

    const startFace = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (faceVideoRef.current) {
          faceVideoRef.current.srcObject = stream;
          await faceVideoRef.current.play();
        }
        setFaceStreamActive(true);

        const intervalId = setInterval(() => {
          if (!active || !faceVideoRef.current || faceVideoRef.current.readyState < 2) return;

          // Jika template belum ada, minta Ryan mendaftar 1 kali
          if (!faceTemplate && !hasFaceTemplate()) {
            setFaceStatusText("Wajah pemilik belum terdaftar. Tekan tombol di bawah untuk merekam.");
            return;
          }

          try {
            const currentVec = extractFaceVector(faceVideoRef.current);
            const refTemplate = faceTemplate || fetchFaceTemplateFromCloud();
            if (!currentVec || !refTemplate) {
              setFaceStatusText("Posisikan wajah Anda di dalam lingkaran...");
              consecutiveMatchRef.current = 0;
              return;
            }

            // Hitung kemiripan kosinus terhadap wajah Ryan yang sah
            const score = compareFaceVectors(currentVec, refTemplate as Float32Array);
            const pct = Math.round(score * 100);
            setFaceMatchScore(pct);

            // Ambang batas ketat: wajah lain (seperti mama) bernilai jauh di bawah 80%
            if (score >= 0.81) {
              consecutiveMatchRef.current += 1;
              setFaceStatusText(`Mengenali Ryan Wardiana (${pct}% cocok)...`);
              if (consecutiveMatchRef.current >= 3) {
                clearInterval(intervalId);
                setFaceStatusText("Wajah Terverifikasi: Ryan Wardiana");
                triggerSuccess("Wajah Terverifikasi");
              }
            } else {
              consecutiveMatchRef.current = 0;
              setFaceStatusText(`Wajah tidak cocok (Bukan Pemilik) · ${pct}%`);
            }
          } catch (_e) {}
        }, 180);

        return () => {
          clearInterval(intervalId);
        };
      } catch (_e) {
        setFaceStreamActive(false);
        setFaceStatusText("Kamera depan tidak dapat diakses.");
      }
    };

    startFace();

    return () => {
      active = false;
      stopFaceCamera();
    };
  }, [isOpen, tab, faceTemplate]);

  const stopFaceCamera = () => {
    if (faceVideoRef.current?.srcObject) {
      const s = faceVideoRef.current.srcObject as MediaStream;
      s.getTracks().forEach((t) => t.stop());
      faceVideoRef.current.srcObject = null;
    }
    setFaceStreamActive(false);
  };

  const handleRegisterOwnerFace = async () => {
    if (!faceVideoRef.current) return;
    const vec = extractFaceVector(faceVideoRef.current);
    if (!vec) {
      setFaceStatusText("Posisikan wajah tepat di tengah lingkaran.");
      return;
    }
    await syncFaceTemplateToCloud(vec);
    setFaceTemplate(vec);
    setAsOwnerDevice(true);
    setIsOwner(true);
    setFaceStatusText("Wajah Ryan berhasil disimpan sebagai kunci biometrik!");
  };

  // --- TAB 3: PIN INPUT ---
  const handlePinDigit = async (digit: string) => {
    if (pin.length >= 6) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setPinError(false);

    if (nextPin.length === 6) {
      setPinLoading(true);
      const ok = await verifyAdminPin(nextPin);
      setPinLoading(false);
      if (ok) {
        // Jika memasukkan PIN 585264 di HP sendiri, tandai sebagai HP Pemilik
        setAsOwnerDevice(true);
        setIsOwner(true);
        triggerSuccess("PIN Terverifikasi");
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

  useEffect(() => {
    if (!isOpen || tab !== "pin") return;
    const handleKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handlePinDigit(e.key);
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
        background: "rgba(15, 23, 42, 0.9)",
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
          maxWidth: "420px",
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header Bersih */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a, #1e293b)",
            color: "white",
            padding: "18px 20px",
            position: "relative",
            textAlign: "center",
          }}
        >
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                background: "transparent",
                border: 0,
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              <X />
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Verifikasi Keamanan</h2>
        </div>

        {/* 3 Tab Navigasi Bersih (Pada HP orang lain langsung diarahkan ke PIN) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isOwner ? "repeat(3, 1fr)" : "1fr",
            background: "#f1f5f9",
            padding: "4px",
            gap: "4px",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => setTab("qr")}
                style={{
                  padding: "11px 4px",
                  border: 0,
                  borderRadius: "8px",
                  background: tab === "qr" ? "white" : "transparent",
                  color: tab === "qr" ? "#0f172a" : "#64748b",
                  fontWeight: tab === "qr" ? 800 : 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: tab === "qr" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                Barcode
              </button>
              <button
                type="button"
                onClick={() => setTab("face")}
                style={{
                  padding: "11px 4px",
                  border: 0,
                  borderRadius: "8px",
                  background: tab === "face" ? "white" : "transparent",
                  color: tab === "face" ? "#0f172a" : "#64748b",
                  fontWeight: tab === "face" ? 800 : 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: tab === "face" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                Verifikasi Wajah
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setTab("pin")}
            style={{
              padding: "11px 4px",
              border: 0,
              borderRadius: "8px",
              background: tab === "pin" ? "white" : "transparent",
              color: tab === "pin" ? "#0f172a" : "#64748b",
              fontWeight: tab === "pin" ? 800 : 600,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: tab === "pin" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            PIN
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: "20px", textAlign: "center", minHeight: "330px" }}>
          {verifiedSuccess ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "270px",
                gap: "14px",
              }}
            >
              {/* Animasi Centang Interaktif */}
              <div
                style={{
                  width: "74px",
                  height: "74px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 0 10px #f0fdf4",
                  animation: "bounceIn 0.5s ease-out forwards",
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 style={{ margin: 0, color: "#166534", fontSize: "1.15rem", fontWeight: 800 }}>{verifiedSuccess}</h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>Membuka akses portal...</p>
            </div>
          ) : tab === "qr" ? (
            <div>
              {/* Jika HP Ryan: Menampilkan kamera pemindai Barcode TV */}
              {isMobile && isOwner ? (
                <div>
                  <div
                    style={{
                      position: "relative",
                      width: "220px",
                      height: "220px",
                      margin: "0 auto 12px",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "3px solid #3b82f6",
                      boxShadow: "0 4px 14px rgba(59, 130, 246, 0.2)",
                      background: "#000",
                    }}
                  >
                    <video
                      ref={scannerVideoRef}
                      playsInline
                      muted
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: "20px",
                        border: "2px dashed #60a5fa",
                        borderRadius: "10px",
                        pointerEvents: "none",
                      }}
                    />
                  </div>
                  {mobileAuthMsg && (
                    <p style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 600, margin: "6px 0" }}>
                      {mobileAuthMsg}
                    </p>
                  )}
                  <div style={{ marginTop: "12px", display: "flex", gap: "6px", justifyContent: "center" }}>
                    <input
                      type="text"
                      placeholder="Kode TV (6 Huruf)"
                      maxLength={6}
                      value={manualCodeInput}
                      onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                      style={{
                        width: "140px",
                        textAlign: "center",
                        textTransform: "uppercase",
                        fontWeight: 800,
                        fontSize: "0.95rem",
                        letterSpacing: "0.15em",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => approveCode(manualCodeInput)}
                      style={{
                        padding: "8px 14px",
                        background: "#0f172a",
                        color: "white",
                        border: 0,
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                      }}
                    >
                      Buka TV
                    </button>
                  </div>
                </div>
              ) : (
                /* Desktop / Smart TV view: Hanya menampilkan Barcode */
                <div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "10px",
                      background: "white",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    }}
                  >
                    <img
                      src={getQrCodeImageUrl(authUrl, 180)}
                      alt="Barcode Sesi"
                      style={{ width: "180px", height: "180px", display: "block", borderRadius: "8px" }}
                    />
                  </div>
                  <div style={{ marginTop: "12px" }}>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 900,
                        letterSpacing: "0.22em",
                        color: "#1e293b",
                        fontFamily: "monospace",
                        margin: "4px 0",
                      }}
                    >
                      {pairingCode}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "10px",
                      fontSize: "0.8rem",
                      color: "#059669",
                      background: "#ecfdf5",
                      padding: "6px 14px",
                      borderRadius: "999px",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#10b981",
                        display: "inline-block",
                      }}
                    />
                    Menunggu otorisasi HP Ryan...
                  </div>
                </div>
              )}
            </div>
          ) : tab === "face" ? (
            <div>
              {/* Verifikasi Wajah Biometrik Asli */}
              <div
                style={{
                  position: "relative",
                  width: "180px",
                  height: "180px",
                  margin: "0 auto 12px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: faceMatchScore && faceMatchScore >= 80 ? "3px solid #10b981" : "3px solid #6366f1",
                  boxShadow: "0 0 20px rgba(99, 102, 241, 0.2)",
                  background: "#000",
                }}
              >
                <video
                  ref={faceVideoRef}
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scaleX(-1)",
                  }}
                />
                {faceStreamActive && (
                  <div
                    style={{
                      position: "absolute",
                      inset: "10px",
                      border: "2px dashed rgba(255,255,255,0.7)",
                      borderRadius: "50%",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
              <p
                style={{
                  fontSize: "0.88rem",
                  color: faceMatchScore && faceMatchScore >= 80 ? "#16a34a" : "#0f172a",
                  fontWeight: 700,
                  minHeight: "24px",
                  margin: "6px 0",
                }}
              >
                {faceStatusText}
              </p>

              {/* Jika template belum ada sama sekali */}
              {!faceTemplate && !hasFaceTemplate() && (
                <button
                  type="button"
                  onClick={handleRegisterOwnerFace}
                  style={{
                    marginTop: "8px",
                    padding: "9px 18px",
                    background: "#0f172a",
                    color: "white",
                    border: 0,
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                  }}
                >
                  Daftarkan Wajah Ryan (1x)
                </button>
              )}

              {/* Tautan rekam ulang jika pencahayaan berbeda */}
              {(faceTemplate || hasFaceTemplate()) && (
                <button
                  type="button"
                  onClick={handleRegisterOwnerFace}
                  style={{
                    marginTop: "8px",
                    background: "transparent",
                    border: 0,
                    color: "#64748b",
                    fontSize: "0.75rem",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  Perbarui sampel wajah
                </button>
              )}
            </div>
          ) : (
            <div>
              <p style={{ margin: "0 0 12px", fontSize: "0.86rem", color: "#475569" }}>
                Masukkan PIN
              </p>

              {/* 6 Titik Indikator PIN */}
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
                        width: "15px",
                        height: "15px",
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

              {/* Keypad Angka */}
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
                      else handlePinDigit(btn);
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
      </div>
    </div>
  );
}
