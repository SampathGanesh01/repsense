"use client";

import { useEffect, useRef, useState } from "react";
import { PoseTracker } from "@/lib/pose/poseClient";
import { drawSkeleton } from "@/lib/pose/skeletonOverlay";
import type { PoseFrame } from "@/lib/pose/types";

interface CameraViewProps {
  onFrame: (frame: PoseFrame | null) => void;
}

type CameraStatus = "requesting" | "ready" | "denied" | "unavailable";

export function CameraView({ onFrame }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackerRef = useRef<PoseTracker | null>(null);
  const [status, setStatus] = useState<CameraStatus>("requesting");

  // The camera/tracker setup below only runs once per mount; callers (like
  // WorkoutSession) swap `onFrame` as the workout moves from calibrating to
  // active without remounting the camera, so the tracker loop must always
  // call the *latest* callback rather than the one captured at setup time.
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function setup() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("ready");

        const tracker = new PoseTracker();
        trackerRef.current = tracker;
        await tracker.start(videoRef.current, (frame) => {
          drawOverlay(frame);
          onFrameRef.current(frame);
        });
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setStatus(name === "NotAllowedError" ? "denied" : "unavailable");
      }
    }

    function drawOverlay(frame: PoseFrame | null) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawSkeleton(ctx, frame, canvas.width, canvas.height);
    }

    setup();

    return () => {
      cancelled = true;
      trackerRef.current?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="relative w-full h-[62vh] sm:h-[72vh] max-h-[900px] bg-black rounded-xl overflow-hidden">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover -scale-x-100" muted playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full -scale-x-100" />
      {status === "requesting" && (
        <Overlay>Requesting camera access…</Overlay>
      )}
      {status === "denied" && (
        <Overlay>
          Camera access was denied. Please allow camera access in your browser settings and reload the page.
        </Overlay>
      )}
      {status === "unavailable" && (
        <Overlay>We couldn&apos;t access a camera on this device. Try a different browser or device.</Overlay>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-center p-6 text-sm">
      {children}
    </div>
  );
}
