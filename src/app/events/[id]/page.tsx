import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MapPin, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { EventMap } from "@/components/event-map";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { EventImage } from "@/components/event-image";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const event = await prisma.event.findFirst({
      where: { id, status: "published" },
      include: { venue: true },
    });

    if (!event) notFound();

    const tags = Array.isArray(event.tags) ? (event.tags as unknown as string[]) : [];

    const priceLabel = event.isFree
      ? "Gratis"
      : typeof event.priceMin === "number" && typeof event.priceMax === "number"
        ? `${event.priceMin}–${event.priceMax} kr`
        : typeof event.priceMin === "number"
          ? `${event.priceMin} kr+`
          : "Pris ej angivet";

    const dateLabel = format(new Date(event.startAt), "EEEE d MMMM", { locale: sv });
    const timeLabel = format(new Date(event.startAt), "HH:mm", { locale: sv });

    return (
      <main className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-black">{event.title}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-black/60">
            <span>{dateLabel}</span>
            <span>{timeLabel}</span>
          </div>
        </header>

        {event.imageUrl && (
          <div className="relative h-48 rounded-2xl overflow-hidden bg-black/5">
            <EventImage
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full"
            />
            <div className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-sm font-medium">
              {priceLabel}
            </div>
          </div>
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-black/70">
            <MapPin size={16} />
            <span>{event.venue.name}</span>
            <span>·</span>
            <span>{event.venue.address}</span>
          </div>

          {event.description && (
            <div className="prose prose-sm max-w-none">
              <p>{event.description}</p>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <h2 className="text-sm font-semibold text-black mb-2">Plats</h2>
            <EventMap lat={event.lat} lng={event.lng} title={event.venue.name} />
            <div className="mt-2 text-xs text-black/60">
              {event.venue.name} · {event.venue.address}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {event.externalUrl && (
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-black hover:bg-black/5"
              >
                <ExternalLink size={16} />
                Öppna länk
              </a>
            )}

            <SaveButton eventId={event.id} />

            <ShareButton eventId={event.id} />
          </div>
        </section>
      </main>
    );
  } catch (error) {
    console.error("Database connection error:", error);
    notFound();
  }
}
