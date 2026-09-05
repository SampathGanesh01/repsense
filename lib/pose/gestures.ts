import { POSE_LANDMARKS, isVisible } from "./landmarks";
import type { PoseFrame } from "./types";

const REQUIRED = [
  POSE_LANDMARKS.LEFT_SHOULDER,
  POSE_LANDMARKS.RIGHT_SHOULDER,
  POSE_LANDMARKS.LEFT_WRIST,
  POSE_LANDMARKS.RIGHT_WRIST,
];

const RAISE_MARGIN = 0.05;

// Both wrists held above shoulder height — used as the hands-free "start"
// signal once the user has stepped back from the laptop after calibrating.
export function isHandsRaised(frame: PoseFrame | null): boolean {
  if (!frame || !REQUIRED.every((i) => isVisible(frame, i))) return false;
  const ls = frame[POSE_LANDMARKS.LEFT_SHOULDER];
  const rs = frame[POSE_LANDMARKS.RIGHT_SHOULDER];
  const lw = frame[POSE_LANDMARKS.LEFT_WRIST];
  const rw = frame[POSE_LANDMARKS.RIGHT_WRIST];
  return lw.y < ls.y - RAISE_MARGIN && rw.y < rs.y - RAISE_MARGIN;
}

// Wrists crossed to the opposite side of the body at roughly chest height
// (an "X" over the chest) — used as the hands-free "stop" signal.
export function isArmsCrossed(frame: PoseFrame | null): boolean {
  if (!frame || !REQUIRED.every((i) => isVisible(frame, i))) return false;
  const ls = frame[POSE_LANDMARKS.LEFT_SHOULDER];
  const rs = frame[POSE_LANDMARKS.RIGHT_SHOULDER];
  const lw = frame[POSE_LANDMARKS.LEFT_WRIST];
  const rw = frame[POSE_LANDMARKS.RIGHT_WRIST];

  const centerX = (ls.x + rs.x) / 2;
  const swapped = Math.sign(lw.x - centerX) !== Math.sign(ls.x - centerX) && Math.sign(rw.x - centerX) !== Math.sign(rs.x - centerX);
  if (!swapped) return false;

  const chestTop = Math.min(ls.y, rs.y) - 0.05;
  const chestBottom = Math.max(ls.y, rs.y) + 0.35;
  const atChestHeight = lw.y > chestTop && lw.y < chestBottom && rw.y > chestTop && rw.y < chestBottom;
  return atChestHeight;
}

// Requires a gesture condition to hold true continuously for `holdMs`
// before firing — a single noisy frame shouldn't start or stop a set.
// Fires once per continuous hold; call reset() (or update(false)) to rearm.
export class HoldTrigger {
  private startedAt: number | null = null;
  private fired = false;

  constructor(private readonly holdMs: number) {}

  update(active: boolean, now: number = performance.now()): boolean {
    if (!active) {
      this.startedAt = null;
      this.fired = false;
      return false;
    }
    if (this.startedAt == null) this.startedAt = now;
    if (!this.fired && now - this.startedAt >= this.holdMs) {
      this.fired = true;
      return true;
    }
    return false;
  }

  reset(): void {
    this.startedAt = null;
    this.fired = false;
  }
}
