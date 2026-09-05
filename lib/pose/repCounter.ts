import type { CueKey, ExerciseDefinition, PoseFrame, RepResult } from "./types";

type Phase = "up" | "down";

// Generic rep-counting state machine shared by all 3 exercises. Each
// exercise only supplies angle math + thresholds (see exercises/*.ts) —
// this class just tracks the up/down phase transition and remembers the
// frame at the deepest point of each rep so form can be evaluated once,
// when the rep completes.
export class RepCounter {
  private phase: Phase = "up";
  private repCount = 0;
  private extremeAngle = Infinity;
  private extremeFrame: PoseFrame | null = null;

  constructor(private readonly def: ExerciseDefinition) {}

  getRepCount(): number {
    return this.repCount;
  }

  reset(): void {
    this.phase = "up";
    this.repCount = 0;
    this.extremeAngle = Infinity;
    this.extremeFrame = null;
  }

  // Feed one pose frame. Returns a RepResult (with cueKeys) only on the
  // frame where a rep completes; otherwise returns null.
  processFrame(frame: PoseFrame): RepResult | null {
    const angle = this.def.primaryAngle(frame);
    if (angle == null || Number.isNaN(angle)) return null;

    if (this.phase === "up") {
      if (angle < this.def.downThreshold) {
        this.phase = "down";
        this.extremeAngle = angle;
        this.extremeFrame = frame;
      }
      return null;
    }

    // phase === "down"
    if (angle < this.extremeAngle) {
      this.extremeAngle = angle;
      this.extremeFrame = frame;
    }

    if (angle > this.def.upThreshold) {
      this.phase = "up";
      this.repCount += 1;
      const cueKeys: CueKey[] = this.extremeFrame
        ? this.def.evaluateForm(this.extremeFrame, this.extremeAngle)
        : [];
      this.extremeAngle = Infinity;
      this.extremeFrame = null;
      return { repCount: this.repCount, cueKeys };
    }

    return null;
  }
}
