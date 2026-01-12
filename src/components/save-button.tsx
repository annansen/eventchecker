"use client";

import { Bookmark } from "lucide-react";

export function SaveButton({ eventId }: { eventId: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const saved = JSON.parse(localStorage.getItem("savedEvents") ?? "[]");
        if (!saved.includes(eventId)) {
          saved.push(eventId);
          localStorage.setItem("savedEvents", JSON.stringify(saved));
          alert("Sparad!");
        } else {
          alert("Redan sparad");
        }
      }}
      className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black hover:bg-black/5"
    >
      <Bookmark size={16} />
      Spara
    </button>
  );
}
