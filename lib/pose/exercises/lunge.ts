import { POSE_LANDMARKS, angleAt, angleFromVertical, isVisible } from "../landmarks";
import type { CueKey, ExerciseDefinition, PoseFrame } from "../types";

// Lunges bend both knees, but the front (working) leg goes deepest. Unlike
// squat/push-up we can't just pick "the more visible side" up front — the
// working leg is whichever one is currently more bent — so this looks at
// both legs each frame and tracks the more-bent one.
function kneeAngle(frame: PoseFrame, hip: number, knee: number, ankle: number): number | null {
  if (!isVisible(frame, hip) || !isVisible(frame, knee) || !isVisible(frame, ankle)) return null;
  return angleAt(frame[hip], frame[knee], frame[ankle]);
}

function minKneeAngle(frame: PoseFrame): number | null {
  const left = kneeAngle(frame, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE);
  const right = kneeAngle(frame, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE);
  if (left == null && right == null) return null;
  if (left == null) return right;
  if (right == null) return left;
  return Math.min(left, right);
}

export const lunge: ExerciseDefinition = {
  key: "LUNGE",
  label: "Lunge",
  requiredLandmarks: [],

  primaryAngle(frame) {
    return minKneeAngle(frame);
  },

  upThreshold: 160,
  downThreshold: 140,

  evaluateForm(extremeFrame, extremeAngle): CueKey[] {
    const cues: CueKey[] = [];

    // Good lunge depth: front knee at ~90deg or less.
    if (extremeAngle > 110) {
      cues.push("go_lower");
    }

    // Torso upright check using whichever hip/shoulder pair is visible.
    const leftOk = isVisible(extremeFrame, POSE_LANDMARKS.LEFT_SHOULDER) && isVisible(extremeFrame, POSE_LANDMARKS.LEFT_HIP);
    const rightOk = isVisible(extremeFrame, POSE_LANDMARKS.RIGHT_SHOULDER) && isVisible(extremeFrame, POSE_LANDMARKS.RIGHT_HIP);
    const pair = leftOk
      ? [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP]
      : rightOk
        ? [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP]
        : null;

    if (pair) {
      const lean = angleFromVertical(extremeFrame[pair[0]], extremeFrame[pair[1]]);
      if (!Number.isNaN(lean) && lean > 40) {
        cues.push("keep_torso_upright");
      }
    }

    return cues;
  },
};
