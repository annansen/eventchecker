"use client";

import { Share2 } from "lucide-react";

export function ShareButton({ eventId }: { eventId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const url = `${window.location.origin}/events/${eventId}`;
        navigator.clipboard.writeText(url);
        alert("Länk kopierad!");
      }}
      className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black hover:bg-black/5"
    >
      <Share2 size={16} />
      Dela
    </button>
  );
}
