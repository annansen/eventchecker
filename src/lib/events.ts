import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { haversineKm } from "@/lib/geo";

export type TimeOfDay = "morning" | "afternoon" | "evening";
export type IndoorOutdoor = "indoor" | "outdoor" | "either";

export type EventFilters = {
  dateFrom: Date;
  dateTo: Date;
  timeOfDay?: TimeOfDay;
  radiusKm?: number;
  priceMax?: number;
  tags?: string[];
  isFree?: boolean;
  indoorOutdoor?: IndoorOutdoor;
  q?: string;
  userLat?: number;
  userLng?: number;
  prefTags?: string[];
};

export type EventListItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  lat: number;
  lng: number;
  priceMin: number | null;
  priceMax: number | null;
  isFree: boolean;
  tags: string[];
  externalUrl: string | null;
  imageUrl: string | null;
  venue: {
    id: string;
    name: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  distanceKm: number | null;
  why: string;
};

export async function queryEvents(filters: EventFilters): Promise<EventListItem[]> {
  const where: Prisma.EventWhereInput = {
    status: "published",
    startAt: {
      gte: filters.dateFrom,
      lte: filters.dateTo,
    },
  };

  if (filters.isFree === true) {
    where.isFree = true;
  }

  if (typeof filters.priceMax === "number") {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [{ isFree: true }, { priceMin: { lte: filters.priceMax } }],
      },
    ];
  }

  if (filters.q && filters.q.trim().length > 0) {
    const q = filters.q.trim();
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { venue: { name: { contains: q } } },
    ];
  }

  const raw = await prisma.event.findMany({
    where,
    include: {
      venue: true,
    },
    orderBy: {
      startAt: "asc",
    },
    take: 200,
  });

  const indoorOutdoorTag =
    filters.indoorOutdoor === "indoor"
      ? "inomhus"
      : filters.indoorOutdoor === "outdoor"
        ? "utomhus"
        : null;

  const userPos =
    typeof filters.userLat === "number" && typeof filters.userLng === "number"
      ? { lat: filters.userLat, lng: filters.userLng }
      : null;

  const filtered = raw
    .map((e) => {
      const tags = Array.isArray(e.tags) ? (e.tags as unknown as string[]) : [];

      const distanceKm =
        userPos && typeof e.lat === "number" && typeof e.lng === "number"
          ? haversineKm(userPos, { lat: e.lat, lng: e.lng })
          : null;

      return {
        ...e,
        tags,
        distanceKm,
      };
    })
    .filter((e) => {
      if (typeof filters.radiusKm === "number" && filters.radiusKm > 0) {
        if (e.distanceKm == null) return false;
        if (e.distanceKm > filters.radiusKm) return false;
      }

      if (indoorOutdoorTag) {
        if (!e.tags.includes(indoorOutdoorTag)) return false;
      }

      if (filters.tags && filters.tags.length > 0) {
        const wanted = new Set(filters.tags);
        const matches = e.tags.some((t) => wanted.has(t));
        if (!matches) return false;
      }

      if (filters.timeOfDay) {
        const hour = new Date(e.startAt).getHours();
        if (filters.timeOfDay === "morning" && !(hour >= 6 && hour < 12)) return false;
        if (filters.timeOfDay === "afternoon" && !(hour >= 12 && hour < 18)) return false;
        if (filters.timeOfDay === "evening" && !(hour >= 18 && hour <= 23)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const t = new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      if (t !== 0) return t;
      if (a.distanceKm == null || b.distanceKm == null) return 0;
      return a.distanceKm - b.distanceKm;
    })
    .map((e) => {
      const whyParts: string[] = [];

      whyParts.push("Inom 72 timmar");

      if (filters.isFree === true || e.isFree) {
        if (filters.isFree === true) whyParts.push("matchar Gratis");
      }

      if (filters.tags && filters.tags.length > 0) {
        const overlap = filters.tags.filter((t) => e.tags.includes(t));
        if (overlap.length > 0) whyParts.push(`matchar ${overlap.slice(0, 2).join(", ")}`);
      } else if (filters.prefTags && filters.prefTags.length > 0) {
        const overlap = filters.prefTags.filter((t) => e.tags.includes(t));
        if (overlap.length > 0) whyParts.push(`för att du gillar ${overlap.slice(0, 2).join(", ")}`);
      }

      if (userPos && typeof e.distanceKm === "number") {
        whyParts.push(`${Math.round(e.distanceKm)} km bort`);
      }

      return {
        id: e.id,
        title: e.title,
        description: e.description,
        startAt: e.startAt,
        endAt: e.endAt,
        lat: e.lat,
        lng: e.lng,
        priceMin: e.priceMin,
        priceMax: e.priceMax,
        isFree: e.isFree,
        tags: e.tags,
        externalUrl: e.externalUrl,
        imageUrl: e.imageUrl,
        venue: {
          id: e.venue.id,
          name: e.venue.name,
          address: e.venue.address,
          city: e.venue.city,
          lat: e.venue.lat,
          lng: e.venue.lng,
        },
        distanceKm: e.distanceKm,
        why: whyParts.join(" · "),
      } satisfies EventListItem;
    });

  return filtered;
}
