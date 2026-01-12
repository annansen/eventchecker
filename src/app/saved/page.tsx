"use client";

import { useEffect, useState } from "react";
import type { EventListItem } from "@/lib/events";
import { EventCard } from "@/components/event-card";
import { Trash2 } from "lucide-react";

export default function SavedPage() {
  const [saved, setSaved] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem("savedEvents") ?? "[]") as string[];
    if (savedIds.length === 0) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      from: new Date().toISOString(),
      to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });

    Promise.all(
      savedIds.map((id) =>
        fetch(`/api/events?id=${id}&${params.toString()}`)
          .then((r) => r.json())
          .then((r) => r.events?.[0])
          .catch(() => null)
      )
    )
      .then((events) => events.filter(Boolean) as EventListItem[])
      .then(setSaved)
      .finally(() => setLoading(false));
  }, []);

  const onRemove = (eventId: string) => {
    const current = JSON.parse(localStorage.getItem("savedEvents") ?? "[]") as string[];
    const next = current.filter((id) => id !== eventId);
    localStorage.setItem("savedEvents", JSON.stringify(next));
    setSaved((prev) => prev.filter((e) => e.id !== eventId));
  };

  if (loading) {
    return (
      <main>
        <h1 className="text-xl font-semibold text-black">Sparade</h1>
        <p className="mt-1 text-sm text-black/60">Laddar...</p>
      </main>
    );
  }

  if (saved.length === 0) {
    return (
      <main>
        <h1 className="text-xl font-semibold text-black">Sparade</h1>
        <p className="mt-1 text-sm text-black/60">Inga sparade evenemang än.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-black">Sparade</h1>
        <p className="mt-1 text-sm text-black/60">{saved.length} evenemang</p>
      </header>

      <section className="space-y-3">
        {saved.map((e) => (
          <div key={e.id} className="relative">
            <EventCard event={e} />
            <button
              type="button"
              onClick={() => onRemove(e.id)}
              className="absolute top-2 right-2 rounded-full bg-white/80 p-2 text-black/60 hover:bg-white hover:text-black"
              aria-label="Ta bort"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
