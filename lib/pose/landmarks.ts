import type { Landmark, PoseFrame } from "./types";

// MediaPipe BlazePose landmark indices we care about.
// https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export const MIN_VISIBILITY = 0.5;

export function visibilityOf(frame: PoseFrame, index: number): number {
  return frame[index]?.visibility ?? 0;
}

export function isVisible(frame: PoseFrame, index: number): boolean {
  return visibilityOf(frame, index) >= MIN_VISIBILITY;
}

export function minVisibility(frame: PoseFrame, indices: number[]): number {
  return Math.min(...indices.map((i) => visibilityOf(frame, i)));
}

// Angle at point b, formed by rays b->a and b->c, in degrees (0-180).
export function angleAt(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);
  if (magAB === 0 || magCB === 0) return NaN;
  const cos = Math.min(1, Math.max(-1, (abx * cbx + aby * cby) / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

// Angle between the vector from b to a and the vertical "up" axis in image
// space (y decreases upward). 0 = perfectly upright, 90 = horizontal.
export function angleFromVertical(a: Landmark, b: Landmark): number {
  const vx = a.x - b.x;
  const vy = a.y - b.y;
  const mag = Math.hypot(vx, vy);
  if (mag === 0) return NaN;
  // Vertical "up" unit vector in image space is (0, -1).
  const cos = Math.min(1, Math.max(-1, -vy / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

export type Side = "left" | "right";

const SIDE_LANDMARKS: Record<Side, { shoulder: number; elbow: number; wrist: number; hip: number; knee: number; ankle: number }> = {
  left: {
    shoulder: POSE_LANDMARKS.LEFT_SHOULDER,
    elbow: POSE_LANDMARKS.LEFT_ELBOW,
    wrist: POSE_LANDMARKS.LEFT_WRIST,
    hip: POSE_LANDMARKS.LEFT_HIP,
    knee: POSE_LANDMARKS.LEFT_KNEE,
    ankle: POSE_LANDMARKS.LEFT_ANKLE,
  },
  right: {
    shoulder: POSE_LANDMARKS.RIGHT_SHOULDER,
    elbow: POSE_LANDMARKS.RIGHT_ELBOW,
    wrist: POSE_LANDMARKS.RIGHT_WRIST,
    hip: POSE_LANDMARKS.RIGHT_HIP,
    knee: POSE_LANDMARKS.RIGHT_KNEE,
    ankle: POSE_LANDMARKS.RIGHT_ANKLE,
  },
};

// Picks whichever side of the body is more visible in this frame (the
// camera may only see one side clearly depending on angle), so exercises
// don't have to hardcode left vs right.
export function pickBestSide(frame: PoseFrame): Side {
  const leftScore =
    visibilityOf(frame, POSE_LANDMARKS.LEFT_SHOULDER) +
    visibilityOf(frame, POSE_LANDMARKS.LEFT_HIP) +
    visibilityOf(frame, POSE_LANDMARKS.LEFT_KNEE) +
    visibilityOf(frame, POSE_LANDMARKS.LEFT_ANKLE);
  const rightScore =
    visibilityOf(frame, POSE_LANDMARKS.RIGHT_SHOULDER) +
    visibilityOf(frame, POSE_LANDMARKS.RIGHT_HIP) +
    visibilityOf(frame, POSE_LANDMARKS.RIGHT_KNEE) +
    visibilityOf(frame, POSE_LANDMARKS.RIGHT_ANKLE);
  return rightScore >= leftScore ? "right" : "left";
}

export function sideLandmarkIndices(side: Side) {
  return SIDE_LANDMARKS[side];
}
