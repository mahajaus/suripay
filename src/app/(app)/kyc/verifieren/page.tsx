"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SP, BT } from "@/lib/ui";

type Phase = "intro" | "selfie" | "id" | "review" | "done";

// Minimale typing voor de experimentele Shape Detection API (alleen Chromium).
type Face = { boundingBox?: DOMRectReadOnly };
type FaceDetectorLike = { detect(s: CanvasImageSource): Promise<Face[]> };

const LIVENESS = [
  "Kijk recht in de camera",
  "Knipper langzaam met je ogen",
  "Draai je hoofd licht naar links en rechts",
];

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const tier = params.get("tier") || "medium";

  const [phase, setPhase] = useState<Phase>("intro");
  const [consent, setConsent] = useState(false);
  const [camError, setCamError] = useState("");
  const [faceOk, setFaceOk] = useState(false);
  const [live, setLive] = useState(0);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [idDoc, setIdDoc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera + (best-effort) gezichtsdetectie tijdens de selfie-stap.
  useEffect(() => {
    if (phase !== "selfie") return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        const Ctor = (
          window as unknown as {
            FaceDetector?: new (o?: object) => FaceDetectorLike;
          }
        ).FaceDetector;
        const detector = Ctor ? new Ctor({ fastMode: true }) : null;

        timer = setInterval(async () => {
          if (!videoRef.current) return;
          if (!detector) {
            // Geen detector beschikbaar → na korte tijd "klaar" beschouwen.
            setFaceOk(true);
            return;
          }
          try {
            const faces = await detector.detect(videoRef.current);
            setFaceOk(faces.length > 0);
          } catch {
            setFaceOk(true);
          }
        }, 700);
      } catch {
        if (!cancelled)
          setCamError(
            "Kan camera niet openen. Geef toestemming of upload een foto."
          );
      }
    };
    start();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [phase]);

  // Liveness-prompt rouleert elke 2,5s.
  useEffect(() => {
    if (phase !== "selfie") return;
    const t = setInterval(
      () => setLive((p) => (p + 1) % LIVENESS.length),
      2500
    );
    return () => clearInterval(t);
  }, [phase]);

  const captureSelfie = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 480;
    canvas.height = v.videoHeight || 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    setSelfie(canvas.toDataURL("image/jpeg", 0.85));
    setPhase("id");
  };

  const onIdFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setIdDoc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSelfieFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelfie(reader.result as string);
      setPhase("id");
    };
    reader.readAsDataURL(file);
  };

  const dataUrlToBlob = (d: string) => fetch(d).then((r) => r.blob());

  const submit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd.");

      const ts = Date.now();
      const selfiePath = `${user.id}/selfie_${ts}.jpg`;
      const idPath = `${user.id}/id_${ts}.jpg`;

      if (selfie) {
        const blob = await dataUrlToBlob(selfie);
        const { error } = await supabase.storage
          .from("kyc")
          .upload(selfiePath, blob, { contentType: "image/jpeg" });
        if (error) throw error;
      }
      if (idDoc) {
        const blob = await dataUrlToBlob(idDoc);
        const { error } = await supabase.storage
          .from("kyc")
          .upload(idPath, blob, { contentType: "image/jpeg" });
        if (error) throw error;
      }

      const { error: insErr } = await supabase.from("kyc_submissions").insert({
        user_id: user.id,
        requested_tier: tier,
        status: "pending",
        selfie_path: selfie ? selfiePath : null,
        id_doc_path: idDoc ? idPath : null,
      });
      if (insErr) throw insErr;

      setPhase("done");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Inzenden mislukt. Probeer het opnieuw."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,.07)",
    borderRadius: 16,
    padding: 22,
    border: "1px solid rgba(255,255,255,.08)",
  };

  return (
    <div style={{ paddingTop: 12 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
        🪪 Identiteit verifiëren
      </h2>

      {error && (
        <p style={{ color: SP.red, fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}

      {/* INTRO */}
      {phase === "intro" && (
        <div style={card}>
          <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.7 }}>
            Voor niveau <b style={{ color: SP.gold }}>{tier}</b> verifiëren we je
            identiteit met een <b>selfie</b> en een foto van je{" "}
            <b>identiteitsbewijs</b>. Zorg voor goed licht en houd je gezicht in
            beeld.
          </p>
          <label
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              fontSize: 12,
              opacity: 0.7,
              margin: "16px 0",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            Ik geef toestemming om mijn selfie en ID veilig te verwerken voor
            identiteitsverificatie.
          </label>
          <button
            onClick={() => setPhase("selfie")}
            disabled={!consent}
            style={BT(consent ? SP.gold : "rgba(255,255,255,.2)", SP.ink)}
          >
            Start verificatie
          </button>
        </div>
      )}

      {/* SELFIE */}
      {phase === "selfie" && (
        <div style={{ ...card, textAlign: "center" }}>
          {camError ? (
            <>
              <p style={{ color: SP.red, fontSize: 13, marginBottom: 14 }}>
                {camError}
              </p>
              <label style={{ ...BT(SP.green), display: "inline-block" }}>
                Selecteer selfie
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={onSelfieFallback}
                  style={{ display: "none" }}
                />
              </label>
            </>
          ) : (
            <>
              <div
                style={{
                  position: "relative",
                  width: 240,
                  height: 300,
                  margin: "0 auto 14px",
                }}
              >
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 140,
                    transform: "scaleX(-1)",
                    background: "rgba(0,0,0,.3)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 140,
                    border: `3px solid ${faceOk ? SP.green : "rgba(255,255,255,.3)"}`,
                    boxShadow: faceOk ? `0 0 20px ${SP.green}55` : "none",
                    transition: "all .3s",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: faceOk ? SP.green : "rgba(255,255,255,.5)",
                  marginBottom: 6,
                }}
              >
                {faceOk ? "● Gezicht herkend" : "Zoeken naar gezicht…"}
              </div>
              <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
                {LIVENESS[live]}
              </p>
              <button
                onClick={captureSelfie}
                disabled={!faceOk}
                style={BT(faceOk ? SP.gold : "rgba(255,255,255,.2)", SP.ink)}
              >
                Maak selfie
              </button>
            </>
          )}
        </div>
      )}

      {/* ID */}
      {phase === "id" && (
        <div style={{ ...card, textAlign: "center" }}>
          <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 14 }}>
            Maak een foto van de voorkant van je ID-kaart of paspoort
          </p>
          {idDoc && (
            <img
              src={idDoc}
              alt="ID"
              style={{
                width: "100%",
                borderRadius: 12,
                marginBottom: 14,
                border: "1px solid rgba(255,255,255,.1)",
              }}
            />
          )}
          <label style={{ ...BT(SP.green), display: "inline-block" }}>
            {idDoc ? "Opnieuw" : "ID fotograferen"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onIdFile}
              style={{ display: "none" }}
            />
          </label>
          {idDoc && (
            <button
              onClick={() => setPhase("review")}
              style={{ ...BT(SP.gold, SP.ink), marginTop: 10 }}
            >
              Volgende
            </button>
          )}
        </div>
      )}

      {/* REVIEW */}
      {phase === "review" && (
        <div style={card}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
            Controleer je inzending
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {selfie && (
              <img
                src={selfie}
                alt="selfie"
                style={{ width: "50%", borderRadius: 12 }}
              />
            )}
            {idDoc && (
              <img
                src={idDoc}
                alt="id"
                style={{ width: "50%", borderRadius: 12, objectFit: "cover" }}
              />
            )}
          </div>
          <button
            onClick={submit}
            disabled={submitting}
            style={BT(submitting ? "rgba(255,255,255,.2)" : SP.gold, SP.ink)}
          >
            {submitting ? "Bezig met inzenden…" : "Verstuur ter verificatie"}
          </button>
        </div>
      )}

      {/* DONE */}
      {phase === "done" && (
        <div style={{ ...card, textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 48 }}>🕓</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: SP.gold,
              margin: "10px 0",
            }}
          >
            Verificatie ingediend
          </div>
          <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 18 }}>
            We controleren je gegevens. Je niveau wordt bijgewerkt zodra de
            verificatie is goedgekeurd.
          </p>
          <button
            onClick={() => router.push("/kyc")}
            style={{ ...BT(SP.gold, SP.ink), width: "auto", padding: "12px 28px" }}
          >
            ← Terug naar KYC
          </button>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
