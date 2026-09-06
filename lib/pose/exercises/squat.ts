import { angleAt, angleFromVertical, isVisible, pickBestSide, sideLandmarkIndices } from "../landmarks";
import type { CueKey, ExerciseDefinition } from "../types";

export const squat: ExerciseDefinition = {
  key: "SQUAT",
  label: "Squat",
  demoVideoUrl: "https://www.youtube.com/watch?v=LJH8WKtmMpo",
  requiredLandmarks: [], // resolved dynamically per-side in primaryAngle

  primaryAngle(frame) {
    const side = pickBestSide(frame);
    const idx = sideLandmarkIndices(side);
    const points = [idx.shoulder, idx.hip, idx.knee, idx.ankle];
    if (!points.every((i) => isVisible(frame, i))) return null;

    // Knee angle: hip - knee - ankle. ~170-180 standing, drops as you sit
    // into the squat.
    return angleAt(frame[idx.hip], frame[idx.knee], frame[idx.ankle]);
  },

  // Loose enough that a shallow squat still counts as a rep.
  upThreshold: 160,
  downThreshold: 140,

  evaluateForm(extremeFrame, extremeAngle): CueKey[] {
    const cues: CueKey[] = [];
    const side = pickBestSide(extremeFrame);
    const idx = sideLandmarkIndices(side);

    // Good squat depth is roughly thighs-parallel-or-below, ~100deg or less
    // at the knee. Anything shallower gets a depth cue.
    if (extremeAngle > 100) {
      cues.push("go_lower");
    }

    // Torso lean: angle of the shoulder->hip line from vertical. Leaning
    // too far forward at the bottom usually means a rounding back.
    if (isVisible(extremeFrame, idx.shoulder) && isVisible(extremeFrame, idx.hip)) {
      const lean = angleFromVertical(extremeFrame[idx.shoulder], extremeFrame[idx.hip]);
      if (!Number.isNaN(lean) && lean > 45) {
        cues.push("keep_back_straighter");
      }
    }

    return cues;
  },
};
