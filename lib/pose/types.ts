export type Landmark = { x: number; y: number; z: number; visibility?: number };

// One frame of MediaPipe Pose output: 33 normalized landmarks.
export type PoseFrame = Landmark[];

export type ExerciseKey = "SQUAT" | "PUSHUP" | "LUNGE";

export type CueKey =
  | "go_lower"
  | "keep_back_straighter"
  | "keep_body_straight"
  | "keep_torso_upright";

export interface RepResult {
  repCount: number;
  cueKeys: CueKey[];
}

export interface ExerciseDefinition {
  key: ExerciseKey;
  label: string;
  // Public YouTube "watch" URL for the how-to-do-it popup shown on the
  // workout screen.
  demoVideoUrl: string;
  // Landmark indices that must be visible/confident for this exercise's
  // angles to be meaningful. Checked against a visibility threshold.
  requiredLandmarks: number[];
  // The angle (in degrees) that drives rep phase transitions, e.g. knee
  // angle for a squat. Returns null when required landmarks are missing.
  primaryAngle(frame: PoseFrame): number | null;
  // Angle above which the user is considered "up" / at the top of the rep.
  upThreshold: number;
  // Angle below which the user is considered to have entered the "down"
  // phase (this is intentionally looser than the good-form depth check
  // below, so a shallow rep still counts — the cue is what tells the user
  // it was shallow).
  downThreshold: number;
  // Called once per completed rep with the frame captured at the deepest
  // point of the rep and the angle reached there. Returns the cue(s) to
  // show, or an empty array for a clean rep.
  evaluateForm(extremeFrame: PoseFrame, extremeAngle: number): CueKey[];
}
