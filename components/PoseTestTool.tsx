"use client";

import { useEffect, useRef, useState } from "react";
import { PoseTracker } from "@/lib/pose/poseClient";
import { drawSkeleton } from "@/lib/pose/skeletonOverlay";
import { trackingConfidence } from "@/lib/pose/calibration";
import { RepCounter } from "@/lib/pose/repCounter";
import { CUE_MESSAGES, EXERCISES, EXERCISE_KEYS } from "@/lib/pose/exercises";
import { eyebrowClass, inputClass, secondaryButtonClass } from "@/lib/ui";
import type { ExerciseKey } from "@/lib/pose/types";

// Internal dev tool: run the real pose-tracking + rep-counting algorithm
// against a local video file (not the live camera), so behavior can be
// validated against real footage instead of only synthetic test frames.
// Deliberately skips the calibration/confidence gating WorkoutSession uses
// for live UX — every frame is fed straight to the RepCounter so this
// shows raw algorithm behavior.
export function PoseTestTool() {
  const [exerciseKey, setExerciseKey] = useState<ExerciseKey>("SQUAT");
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [angle, setAngle] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [cueLog, setCueLog] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackerRef = useRef<PoseTracker | null>(null);
  const repCounterRef = useRef(new RepCounter(EXERCISES[exerciseKey]));
  const exerciseKeyRef = useRef(exerciseKey);

  function resetCount() {
    repCounterRef.current = new RepCounter(EXERCISES[exerciseKeyRef.current]);
    setRepCount(0);
    setCueLog([]);
  }

  function handleExerciseChange(key: ExerciseKey) {
    exerciseKeyRef.current = key;
    setExerciseKey(key);
    resetCount();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    setVideoSrc(URL.createObjectURL(file));
    resetCount();
  }

  useEffect(() => {
    if (!videoSrc || !videoRef.current) return;
    const video = videoRef.current;
    let cancelled = false;

    const tracker = new PoseTracker();
    trackerRef.current = tracker;
    tracker.start(video, (frame) => {
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) drawSkeleton(ctx, frame, canvas.width, canvas.height);
      }

      const def = EXERCISES[exerciseKeyRef.current];
      setAngle(frame ? def.primaryAngle(frame) : null);
      setConfidence(trackingConfidence(frame, exerciseKeyRef.current));

      if (frame) {
        const result = repCounterRef.current.processFrame(frame);
        if (result) {
          setRepCount(result.repCount);
          const cues = result.cueKeys.length > 0 ? result.cueKeys.map((k) => CUE_MESSAGES[k]).join(", ") : "clean";
          setCueLog((log) => [...log, `Rep ${result.repCount}: ${cues}`]);
        }
      }
    });

    return () => {
      cancelled = true;
      tracker.stop();
    };
  }, [videoSrc]);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col gap-6">
      <div>
        <p className={eyebrowClass()}>Repsensei — Admin</p>
        <h1 className="font-condensed font-bold text-2xl tracking-tight">Pose test tool</h1>
        <p className="text-sm text-muted mt-1">
          Run the real rep-counting algorithm against a local video file to validate it against real footage.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={exerciseKey}
          onChange={(e) => handleExerciseChange(e.target.value as ExerciseKey)}
          className={inputClass("px-3 py-2")}
        >
          {EXERCISE_KEYS.map((key) => (
            <option key={key} value={key}>
              {EXERCISES[key].label}
            </option>
          ))}
        </select>
        <input type="file" accept="video/*" onChange={handleFileChange} className="text-sm" />
        <button onClick={resetCount} className={secondaryButtonClass("px-4 py-2 text-sm")}>
          Reset count
        </button>
      </div>

      {videoSrc && (
        <div className="relative w-full bg-black rounded-xl overflow-hidden">
          <video ref={videoRef} src={videoSrc} controls className="w-full max-h-[60vh]" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 font-mono text-center">
        <div className={inputClass("py-3")}>
          <div className="text-2xl font-semibold">{repCount}</div>
          <div className="text-xs text-muted uppercase">reps</div>
        </div>
        <div className={inputClass("py-3")}>
          <div className="text-2xl font-semibold">{angle == null ? "—" : Math.round(angle)}</div>
          <div className="text-xs text-muted uppercase">angle</div>
        </div>
        <div className={inputClass("py-3")}>
          <div className="text-2xl font-semibold">{Math.round(confidence * 100)}%</div>
          <div className="text-xs text-muted uppercase">confidence</div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className={eyebrowClass()}>Cue log</p>
        <div className="flex flex-col-reverse gap-1 max-h-48 overflow-y-auto font-mono text-xs text-muted">
          {cueLog.length === 0 && <p>No reps counted yet.</p>}
          {cueLog.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </main>
  );
}
