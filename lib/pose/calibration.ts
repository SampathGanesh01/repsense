import { isVisible, pickBestSide, sideLandmarkIndices, visibilityOf } from "./landmarks";
import type { ExerciseKey, PoseFrame } from "./types";

export type CalibrationStatus = { ok: true } | { ok: false; message: string };

const EDGE_MARGIN = 0.03;

// Exercises don't all need the same framing. A push-up only needs the
// working arm + shoulder in view (a side-on, chest-height shot is enough);
// squats and lunges need hip-to-ankle visible because their rep-counting
// angle is measured at the knee. Requiring a full head-to-toe shot for
// every exercise forces squat/lunge users to stand much farther back from
// a laptop webcam than most rooms or desks allow — this only asks for
// what that exercise's angle math actually needs.
function requiredJoints(exercise: ExerciseKey, side: "left" | "right") {
  const idx = sideLandmarkIndices(side);
  if (exercise === "PUSHUP") return [idx.shoulder, idx.elbow, idx.wrist];
  return [idx.shoulder, idx.hip, idx.knee, idx.ankle];
}

// One-time gate before a set can start: can we see what this exercise
// needs, well-lit and centered? Returns a specific instruction rather than
// a generic "can't see you" so the user knows exactly what to fix.
export function checkCalibration(frame: PoseFrame | null, exercise: ExerciseKey): CalibrationStatus {
  if (!frame || frame.length === 0) {
    return { ok: false, message: "We can't see you yet — step into view of the camera." };
  }

  const side = pickBestSide(frame);
  const required = requiredJoints(exercise, side);
  const missing = required.filter((i) => !isVisible(frame, i));

  if (missing.length > 0) {
    return exercise === "PUSHUP"
      ? { ok: false, message: "We can't see your arm and shoulder clearly. Turn side-on to the camera and check the lighting." }
      : { ok: false, message: "We can't see your hips, knees, and ankles clearly. Step back until your legs are fully in frame." };
  }

  if (exercise !== "PUSHUP") {
    const ankle = frame[sideLandmarkIndices(side).ankle];
    if (ankle.y > 1 - EDGE_MARGIN) {
      return { ok: false, message: "Move back a little more so your feet are fully in frame." };
    }
  }

  const xs = required.map((i) => frame[i].x);
  const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;
  if (avgX < 0.15 || avgX > 0.85) {
    return { ok: false, message: "Move to the center of the frame." };
  }

  return { ok: true };
}

// 0-1 score of how well this exercise's core landmarks are being tracked
// right now. Used mid-workout to detect occlusion/bad lighting so a
// possibly-wrong count is never shown silently.
export function trackingConfidence(frame: PoseFrame | null, exercise: ExerciseKey): number {
  if (!frame || frame.length === 0) return 0;
  const side = pickBestSide(frame);
  const scores = requiredJoints(exercise, side).map((i) => visibilityOf(frame, i));
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
