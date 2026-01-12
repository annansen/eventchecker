import Link from "next/link";
import type { EventListItem } from "@/lib/events";

export function EventCard({ event }: { event: EventListItem }) {
  const start = new Date(event.startAt);
  const dateLabel = new Intl.DateTimeFormat("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(start);

  const timeLabel = new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(start);

  const priceLabel = event.isFree
    ? "Gratis"
    : typeof event.priceMin === "number" && typeof event.priceMax === "number"
      ? `${event.priceMin}–${event.priceMax} kr`
      : typeof event.priceMin === "number"
        ? `${event.priceMin} kr+`
        : "Pris ej angivet";

  return (
    <article className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <Link href={`/events/${event.id}`} className="block">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-6 text-black">
                {event.title}
              </h3>
              <p className="mt-1 text-sm text-black/60">
                {event.venue.name} · {event.venue.city}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-medium text-black">{dateLabel}</div>
              <div className="text-sm text-black/60">{timeLabel}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black">
              {priceLabel}
            </span>
            {event.distanceKm != null ? (
              <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium text-black">
                {Math.round(event.distanceKm)} km
              </span>
            ) : null}
            {event.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-900"
              >
                {t}
              </span>
            ))}
          </div>

          {event.description ? (
            <p className="mt-3 text-sm leading-6 text-black/70">
              {event.description}
            </p>
          ) : null}

          <p className="mt-3 text-xs text-black/50">{event.why}</p>
        </div>
      </Link>
    </article>
  );
}
