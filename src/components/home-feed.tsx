"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EventCard } from "@/components/event-card";
import { QuickFilters } from "@/components/quick-filters";
import { SearchBar } from "@/components/search-bar";
import { LocationStatus } from "@/components/location-status";
import { LoadingSpinner } from "@/components/loading-spinner";
import { PullToRefresh } from "@/components/pull-to-refresh";
import type { EventListItem } from "@/lib/events";

export function HomeFeed() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    const params = new URLSearchParams(searchParams.toString());
    
    // Add geolocation if available
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      const { lat, lng } = JSON.parse(savedLocation);
      params.set("lat", lat.toString());
      params.set("lng", lng.toString());
    }

    // Add preferences
    const preferences = JSON.parse(localStorage.getItem("preferences") ?? "[]");
    if (preferences.length > 0) {
      params.set("prefTags", preferences.join(","));
    }

    try {
      const res = await fetch(`/api/events?${params.toString()}`, {
        signal: AbortSignal.timeout(10000), // 10s timeout
      });
      
      if (!res.ok) {
        throw new Error(`Kunde inte hämta events (${res.status})`);
      }
      
      const data = await res.json();
      setEvents(data.events || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError(err instanceof Error ? err.message : "Okänt fel");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchParams]);

  const handleRefresh = async () => {
    await fetchEvents();
  };

  if (loading && events.length === 0) {
    return (
      <main>
        <header>
          <h1 className="text-xl font-semibold text-black">Nära mig i helgen</h1>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm text-black/60">Standard: nästa 72 timmar</p>
            <LocationStatus />
          </div>
          <SearchBar />
          <QuickFilters />
        </header>

        <section className="mt-6 space-y-3">
          <div className="rounded-2xl border border-black/10 bg-white p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-black/60">Laddar evenemang...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <main>
        <header>
          <h1 className="text-xl font-semibold text-black">Nära mig i helgen</h1>
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-black/60">Standard: nästa 72 timmar</p>
              {lastUpdate && (
                <span className="text-xs text-black/40">
                  Uppdaterad {lastUpdate.toLocaleTimeString("sv-SE", { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  })}
                </span>
              )}
            </div>
            <LocationStatus />
          </div>
          <SearchBar />
          <QuickFilters />
        </header>

        <section className="mt-6 space-y-3">
          {error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-2 text-sm font-medium text-amber-900 underline"
              >
                Försök igen
              </button>
            </div>
          ) : events.length === 0 && !loading ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-sm text-black">
                Inga träffar – prova att öka radien eller ta bort filter.
              </p>
            </div>
          ) : (
            <>
              {events.map((e) => <EventCard key={e.id} event={e} />)}
              {loading && (
                <div className="rounded-2xl border border-black/10 bg-white p-4 text-center">
                  <LoadingSpinner />
                  <p className="mt-2 text-xs text-black/60">Uppdaterar...</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </PullToRefresh>
  );
}
