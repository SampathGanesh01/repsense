"use client";

import { primaryButtonClass } from "@/lib/ui";

interface ConsentModalProps {
  onAcknowledge: () => void;
}

export function ConsentModal({ onAcknowledge }: ConsentModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Before we turn on your camera</h2>
        <p className="text-sm text-neutral-600">
          This app uses your device&apos;s camera to track your movement <strong>locally, on your device</strong> so
          it can count your reps and check your form. Your video is never recorded, saved, or sent anywhere — only
          your rep counts and workout stats are stored.
        </p>
        <button onClick={onAcknowledge} className={primaryButtonClass("py-3")}>
          I understand — turn on camera
        </button>
      </div>
    </div>
  );
}
