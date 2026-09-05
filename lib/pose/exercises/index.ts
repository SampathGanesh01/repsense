import { squat } from "./squat";
import { pushup } from "./pushup";
import { lunge } from "./lunge";
import type { CueKey, ExerciseDefinition, ExerciseKey } from "../types";

export const EXERCISES: Record<ExerciseKey, ExerciseDefinition> = {
  SQUAT: squat,
  PUSHUP: pushup,
  LUNGE: lunge,
};

export const EXERCISE_KEYS: ExerciseKey[] = ["SQUAT", "PUSHUP", "LUNGE"];

export function isExerciseKey(value: string): value is ExerciseKey {
  return value === "SQUAT" || value === "PUSHUP" || value === "LUNGE";
}

// Plain-language cues surfaced during a workout. Kept short — this is a
// live overlay, not a coaching essay.
export const CUE_MESSAGES: Record<CueKey, string> = {
  go_lower: "Go a little lower next rep.",
  keep_back_straighter: "Keep your back straighter.",
  keep_body_straight: "Keep your body in a straight line.",
  keep_torso_upright: "Keep your torso more upright.",
};
