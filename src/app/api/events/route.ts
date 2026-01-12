import { NextResponse } from "next/server";
import { z } from "zod";
import { queryEvents } from "@/lib/events";

export const runtime = "nodejs";

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  timeOfDay: z.enum(["morning", "afternoon", "evening"]).optional(),
  radiusKm: z.coerce.number().positive().optional(),
  priceMax: z.coerce.number().int().positive().optional(),
  isFree: z.coerce.boolean().optional(),
  tags: z.string().optional(),
  indoorOutdoor: z.enum(["indoor", "outdoor", "either"]).optional(),
  q: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  prefTags: z.string().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const now = new Date();
  const defaultTo = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const dateFrom = parsed.data.from ? new Date(parsed.data.from) : now;
  const dateTo = parsed.data.to ? new Date(parsed.data.to) : defaultTo;

  const tags = parsed.data.tags
    ? parsed.data.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  const prefTags = parsed.data.prefTags
    ? parsed.data.prefTags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  const events = await queryEvents({
    dateFrom,
    dateTo,
    timeOfDay: parsed.data.timeOfDay,
    radiusKm: parsed.data.radiusKm,
    priceMax: parsed.data.priceMax,
    isFree: parsed.data.isFree,
    tags,
    indoorOutdoor: parsed.data.indoorOutdoor,
    q: parsed.data.q,
    userLat: parsed.data.lat,
    userLng: parsed.data.lng,
    prefTags,
  });

  return NextResponse.json({
    meta: {
      from: dateFrom.toISOString(),
      to: dateTo.toISOString(),
      count: events.length,
    },
    events,
  });
}
