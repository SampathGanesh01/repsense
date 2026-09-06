"use client";

import { eyebrowClass, primaryButtonClass } from "@/lib/ui";

interface ConsentModalProps {
  onAcknowledge: () => void;
}

export function ConsentModal({ onAcknowledge }: ConsentModalProps) {
  return (
    <div className="fixed inset-0 bg-ink/60 flex items-center justify-center p-6 z-50">
      <div className="bg-surface border border-line card-shadow rounded-lg max-w-md w-full p-6 flex flex-col gap-4">
        <p className={eyebrowClass()}>Before you start</p>
        <h2 className="font-condensed font-bold text-xl -mt-1">Turn on your camera</h2>
        <p className="text-sm text-muted leading-relaxed">
          This app uses your device&apos;s camera to track your movement <strong className="text-ink">locally, on
          your device</strong> so it can count your reps and check your form. Your video is never recorded, saved,
          or sent anywhere — only your rep counts and workout stats are stored.
        </p>
        <button onClick={onAcknowledge} className={primaryButtonClass("py-3")}>
          I understand — turn on camera
        </button>
      </div>
    </div>
  );
}
