"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraView } from "./CameraView";
import { ConsentModal } from "./ConsentModal";
import { checkCalibration, trackingConfidence } from "@/lib/pose/calibration";
import { RepCounter } from "@/lib/pose/repCounter";
import { EXERCISES, CUE_MESSAGES } from "@/lib/pose/exercises";
import { HoldTrigger, isArmsCrossed, isHandsRaised } from "@/lib/pose/gestures";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import type { ExerciseKey, CueKey, PoseFrame } from "@/lib/pose/types";

type Stage = "consent" | "calibrating" | "active" | "setSummary";

const LOW_CONFIDENCE_THRESHOLD = 0.5;
const LOW_CONFIDENCE_GRACE_MS = 1200; // ignore brief dips before warning
const GESTURE_HOLD_MS = 700; // how long a gesture must be held to trigger

interface WorkoutSessionProps {
  exerciseKey: ExerciseKey;
  consented: boolean;
}

export function WorkoutSession({ exerciseKey, consented }: WorkoutSessionProps) {
  const router = useRouter();
  const definition = EXERCISES[exerciseKey];

  const [stage, setStage] = useState<Stage>(consented ? "calibrating" : "consent");
  const [calibrationMessage, setCalibrationMessage] = useState<string | null>("Getting the camera ready…");
  const [repCount, setRepCount] = useState(0);
  const [cueMessage, setCueMessage] = useState<string | null>(null);
  const [lowConfidence, setLowConfidence] = useState(false);
  const [lastSetId, setLastSetId] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [savingSet, setSavingSet] = useState(false);

  const workoutIdRef = useRef<string | null>(null);
  const repCounterRef = useRef<RepCounter | null>(null);
  const formCueCountsRef = useRef<Record<string, number>>({});
  const lowConfidenceSinceRef = useRef<number | null>(null);
  const lowConfidenceSecondsRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const cueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handsRaisedTriggerRef = useRef(new HoldTrigger(GESTURE_HOLD_MS));
  const armsCrossedTriggerRef = useRef(new HoldTrigger(GESTURE_HOLD_MS));

  async function ensureWorkout(): Promise<string> {
    if (workoutIdRef.current) return workoutIdRef.current;
    const res = await fetch("/api/workouts", { method: "POST" });
    const data = await res.json();
    workoutIdRef.current = data.id;
    return data.id;
  }

  const startSet = useCallback(() => {
    repCounterRef.current = new RepCounter(definition);
    formCueCountsRef.current = {};
    lowConfidenceSecondsRef.current = 0;
    lowConfidenceSinceRef.current = null;
    lastFrameTimeRef.current = null;
    armsCrossedTriggerRef.current.reset();
    setRepCount(0);
    setCueMessage(null);
    setLowConfidence(false);
    setStage("active");
  }, [definition]);

  // endSet is async and reads `repCount` state, so a memoized frame handler
  // that closed over it directly could fire with a stale rep count. Route
  // gesture-triggered calls through a ref that's always kept current instead.
  const endSetRef = useRef<() => void>(() => {});

  const handleCalibrationFrame = useCallback(
    (frame: PoseFrame | null) => {
      const status = checkCalibration(frame, exerciseKey);
      setCalibrationMessage(status.ok ? null : status.message);

      if (!status.ok) {
        handsRaisedTriggerRef.current.reset();
        return;
      }
      if (handsRaisedTriggerRef.current.update(isHandsRaised(frame))) {
        startSet();
      }
    },
    [exerciseKey, startSet],
  );

  const showCue = useCallback((key: CueKey) => {
    setCueMessage(CUE_MESSAGES[key]);
    if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);
    cueTimeoutRef.current = setTimeout(() => setCueMessage(null), 3000);
  }, []);

  const handleActiveFrame = useCallback((frame: PoseFrame | null) => {
    if (armsCrossedTriggerRef.current.update(isArmsCrossed(frame))) {
      endSetRef.current();
      return;
    }

    const now = performance.now();
    const delta = lastFrameTimeRef.current != null ? now - lastFrameTimeRef.current : 0;
    lastFrameTimeRef.current = now;

    const confidence = trackingConfidence(frame, exerciseKey);
    if (confidence < LOW_CONFIDENCE_THRESHOLD) {
      lowConfidenceSecondsRef.current += delta / 1000;
      if (lowConfidenceSinceRef.current == null) lowConfidenceSinceRef.current = now;
      if (now - lowConfidenceSinceRef.current > LOW_CONFIDENCE_GRACE_MS) {
        setLowConfidence(true);
      }
      return; // don't feed uncertain frames into rep counting
    }
    lowConfidenceSinceRef.current = null;
    setLowConfidence(false);

    if (!frame || !repCounterRef.current) return;
    const result = repCounterRef.current.processFrame(frame);
    if (result) {
      setRepCount(result.repCount);
      if (result.cueKeys.length > 0) {
        for (const key of result.cueKeys) {
          formCueCountsRef.current[key] = (formCueCountsRef.current[key] ?? 0) + 1;
        }
        showCue(result.cueKeys[0]);
      }
    }
  }, [showCue, exerciseKey]);

  const endSet = useCallback(async () => {
    setSavingSet(true);
    try {
      const finalRepCount = repCounterRef.current?.getRepCount() ?? 0;
      const workoutId = await ensureWorkout();
      const res = await fetch("/api/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId,
          exercise: exerciseKey,
          repCount: finalRepCount,
          formCueCounts: formCueCountsRef.current,
          lowConfidenceSec: lowConfidenceSecondsRef.current,
        }),
      });
      const data = await res.json();
      setLastSetId(data.id ?? null);
      setFlagged(false);
      setStage("setSummary");
    } finally {
      setSavingSet(false);
    }
  }, [exerciseKey]);

  useEffect(() => {
    endSetRef.current = () => void endSet();
  }, [endSet]);

  async function flagMiscount() {
    if (!lastSetId || flagged) return;
    setFlagged(true);
    await fetch("/api/flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setId: lastSetId }),
    });
  }

  async function finishWorkout() {
    const workoutId = await ensureWorkout();
    await fetch(`/api/workouts/${workoutId}/complete`, { method: "POST" });
    router.push("/dashboard");
  }

  function doAnotherSet() {
    setCalibrationMessage("Getting the camera ready…");
    setStage("calibrating");
  }

  if (stage === "consent") {
    return (
      <ConsentModal
        onAcknowledge={async () => {
          await fetch("/api/consent", { method: "POST" });
          setStage("calibrating");
        }}
      />
    );
  }

  if (stage === "setSummary") {
    return (
      <main className="flex-1 max-w-3xl mx-auto w-full p-8 flex flex-col gap-8 items-center justify-center text-center">
        <h1 className="text-8xl font-bold tabular-nums">{repCount} reps</h1>
        <p className="text-2xl text-neutral-500">{definition.label} set complete.</p>
        <button
          onClick={flagMiscount}
          disabled={flagged}
          className="text-xl underline text-neutral-500 dark:text-neutral-400 disabled:opacity-40"
        >
          {flagged ? "Thanks, noted." : "That count looked wrong"}
        </button>
        <div className="flex flex-col gap-4 w-full max-w-sm mt-4">
          <button onClick={doAnotherSet} className={secondaryButtonClass("py-6 text-2xl")}>
            Do another {definition.label.toLowerCase()} set
          </button>
          <button onClick={finishWorkout} className={primaryButtonClass("py-6 text-2xl")}>
            Finish workout
          </button>
        </div>
      </main>
    );
  }

  const calibrationOk = stage === "calibrating" && calibrationMessage === null;

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-8">
      <h1 className="text-4xl font-bold">{definition.label}</h1>
      <CameraView onFrame={stage === "active" ? handleActiveFrame : handleCalibrationFrame} />

      {stage === "calibrating" && (
        <div className="flex flex-col gap-4 items-center">
          {calibrationMessage && (
            <p className="text-3xl text-center text-neutral-600 min-h-[2.5rem]">{calibrationMessage}</p>
          )}
          {calibrationOk && (
            <button
              onClick={startSet}
              className="text-4xl font-semibold animate-pulse cursor-pointer bg-transparent border-none"
            >
              🙌 Raise both hands to start
            </button>
          )}
        </div>
      )}

      {stage === "active" && (
        <div className="flex flex-col gap-4 items-center">
          <div className="text-8xl font-bold tabular-nums">{repCount}</div>
          {lowConfidence && (
            <p className="text-2xl text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-center">
              Having trouble tracking you clearly — check your lighting or step back into frame. Rep counting is
              paused until tracking recovers.
            </p>
          )}
          {!lowConfidence && cueMessage && (
            <p className="text-2xl text-neutral-700 bg-neutral-100 rounded-lg px-4 py-3 text-center">{cueMessage}</p>
          )}
          <button onClick={endSet} disabled={savingSet} className={secondaryButtonClass("py-6 px-12 text-2xl")}>
            {savingSet ? "Saving…" : "End set"}
          </button>
          <p className="text-lg text-neutral-500 dark:text-neutral-400">or cross your arms to stop</p>
        </div>
      )}
    </main>
  );
}
