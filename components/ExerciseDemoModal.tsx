"use client";

import { Modal } from "./Modal";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

interface ExerciseDemoModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  videoUrl: string;
}

export function ExerciseDemoModal({ open, onClose, label, videoUrl }: ExerciseDemoModalProps) {
  const embedSrc = toYouTubeEmbedUrl(videoUrl);

  return (
    <Modal open={open} onClose={onClose} eyebrow="How to do it" title={label} widthClass="max-w-2xl">
      <div className="aspect-video w-full rounded-md overflow-hidden bg-black">
        {embedSrc ? (
          <iframe
            src={embedSrc}
            title={`${label} demo video`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <p className="text-white text-sm p-4">Video unavailable.</p>
        )}
      </div>
    </Modal>
  );
}
