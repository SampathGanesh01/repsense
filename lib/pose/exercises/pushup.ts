import { angleAt, isVisible, pickBestSide, sideLandmarkIndices } from "../landmarks";
import type { CueKey, ExerciseDefinition } from "../types";

export const pushup: ExerciseDefinition = {
  key: "PUSHUP",
  label: "Push-up",
  requiredLandmarks: [],

  primaryAngle(frame) {
    const side = pickBestSide(frame);
    const idx = sideLandmarkIndices(side);
    const points = [idx.shoulder, idx.elbow, idx.wrist];
    if (!points.every((i) => isVisible(frame, i))) return null;

    // Elbow angle: shoulder - elbow - wrist. ~160-180 at the top, drops as
    // the chest lowers toward the floor.
    return angleAt(frame[idx.shoulder], frame[idx.elbow], frame[idx.wrist]);
  },

  upThreshold: 155,
  downThreshold: 130,

  evaluateForm(extremeFrame, extremeAngle): CueKey[] {
    const cues: CueKey[] = [];
    const side = pickBestSide(extremeFrame);
    const idx = sideLandmarkIndices(side);

    // Good depth is roughly upper arm parallel to the floor, ~95deg or
    // less at the elbow.
    if (extremeAngle > 95) {
      cues.push("go_lower");
    }

    // Body alignment: shoulder-hip-ankle should stay close to a straight
    // line (~180deg). Sagging hips or a piked butt both show up as a
    // smaller angle here.
    if (
      isVisible(extremeFrame, idx.shoulder) &&
      isVisible(extremeFrame, idx.hip) &&
      isVisible(extremeFrame, idx.ankle)
    ) {
      const bodyLine = angleAt(extremeFrame[idx.shoulder], extremeFrame[idx.hip], extremeFrame[idx.ankle]);
      if (!Number.isNaN(bodyLine) && bodyLine < 160) {
        cues.push("keep_body_straight");
      }
    }

    return cues;
  },
};
