"use client";

import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { PoseFrame } from "./types";

// Off-the-shelf pose estimation via MediaPipe Tasks Vision — no custom pose
// model. The WASM runtime is self-hosted from /public/mediapipe/wasm; the
// model weights are loaded from Google's official model store on first use
// (and cached by the browser after that).
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

function getLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_PATH,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    })();
  }
  return landmarkerPromise;
}

export type PoseFrameCallback = (frame: PoseFrame | null) => void;

// Drives detectForVideo on a rAF loop against a live <video> element and
// hands each detected frame (or null, when nothing was detected) to the
// caller. One instance per active camera session.
export class PoseTracker {
  private landmarker: PoseLandmarker | null = null;
  private rafId: number | null = null;
  private lastVideoTime = -1;
  private stopped = false;

  async start(video: HTMLVideoElement, onFrame: PoseFrameCallback): Promise<void> {
    this.landmarker = await getLandmarker();
    if (this.stopped) return; // stop() called while the model was loading

    const loop = () => {
      if (this.stopped || !this.landmarker) return;
      if (video.readyState >= 2 && video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = video.currentTime;
        const result = this.landmarker.detectForVideo(video, performance.now());
        const landmarks = result.landmarks?.[0] ?? null;
        onFrame(landmarks as PoseFrame | null);
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.stopped = true;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }
}
