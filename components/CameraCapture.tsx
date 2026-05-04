"use client";

import { compressJpegBlob } from "@/lib/image";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  onCaptured: (payload: { blob: Blob; capturedAt: string }) => void;
  onClear: () => void;
  previewUrl: string | null;
};

export function CameraCapture({
  label,
  onCaptured,
  onClear,
  previewUrl,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const startCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not supported in this browser.");
      return;
    }
    try {
      stopStream();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setActive(true);
    } catch {
      setError(
        "Could not access the camera. Allow permission and use HTTPS (or localhost)."
      );
    }
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    setBusy(true);
    setError(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unsupported");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // const capturedAt = new Date().toISOString();
      // const pad = 48;
      // ctx.fillStyle = "rgba(0,0,0,0.55)";
      // ctx.fillRect(0, canvas.height - pad, canvas.width, pad);
      // ctx.fillStyle = "#f8fafc";
      // ctx.font = `600 ${Math.max(14, Math.round(canvas.width * 0.028))}px system-ui, sans-serif`;
      // ctx.fillText(`Captured: ${capturedAt}`, 16, canvas.height - 18);

      // 1. Get the raw ISO string for the database
const capturedAt = new Date().toISOString();

// 2. Format the display string for the Indian timezone
const displayTime = new Date().toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata",
  hour12: true,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const pad = 48;
ctx.fillStyle = "rgba(0,0,0,0.55)";
ctx.fillRect(0, canvas.height - pad, canvas.width, pad);
ctx.fillStyle = "#f8fafc";
ctx.font = `600 ${Math.max(14, Math.round(canvas.width * 0.028))}px system-ui, sans-serif`;

// 3. Use 'displayTime' for the text on the image
ctx.fillText(`Captured: ${displayTime}`, 16, canvas.height - 18);

      const rawBlob: Blob | null = await new Promise((res) =>
        canvas.toBlob((b) => res(b), "image/jpeg", 0.92)
      );
      if (!rawBlob) throw new Error("Capture failed");
      const blob = await compressJpegBlob(rawBlob, 1600, 0.82);
      stopStream();
      onCaptured({ blob, capturedAt });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Capture failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        {previewUrl && (
          <button
            type="button"
            onClick={() => {
              onClear();
              stopStream();
            }}
            className="text-xs font-medium text-red-600 hover:text-red-700"
          >
            Retake
          </button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!previewUrl && (
        <div className="space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-900">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {!active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/70 p-4 text-center text-sm text-slate-100">
                <p>Live camera only — gallery uploads are disabled.</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!active ? (
              <button
                type="button"
                onClick={startCamera}
                className="min-h-[48px] flex-1 rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow hover:bg-blue-700 active:scale-[0.99]"
              >
                Open camera
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={captureFrame}
                className="min-h-[48px] flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Capture photo"}
              </button>
            )}
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className="max-h-80 w-full object-contain bg-slate-950"
          />
        </div>
      )}
    </div>
  );
}
