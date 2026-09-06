import type { PoseFrame } from "./types";

// A minimal set of BlazePose connections, enough to draw a recognizable
// skeleton overlay — this is purely visual feedback so users can see
// they're being tracked, not used for any measurement. Shared between the
// live camera view and the internal pose-testing tool so the two can't
// silently drift apart.
export const SKELETON_CONNECTIONS: Array<[number, number]> = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso sides
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  frame: PoseFrame | null,
  canvasWidth: number,
  canvasHeight: number,
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (!frame) return;

  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 7;
  for (const [a, b] of SKELETON_CONNECTIONS) {
    const pa = frame[a];
    const pb = frame[b];
    if (!pa || !pb) continue;
    if ((pa.visibility ?? 1) < 0.4 || (pb.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x * canvasWidth, pa.y * canvasHeight);
    ctx.lineTo(pb.x * canvasWidth, pb.y * canvasHeight);
    ctx.stroke();
  }
}
