import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as cheerio from "cheerio";
import { z } from "zod";

// Types for scraped data
const EventSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  startAt: z.string(),
  endAt: z.string().optional(),
  location: z.string(),
  externalUrl: z.string().optional(),
  tags: z.array(z.string()),
});

type ScrapedEvent = z.infer<typeof EventSchema>;

// Initialize Prisma with adapter
const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

// Known venues in Linköping
const venueMap: Record<string, string> = {
  "stadsbiblioteket": "Linköpings Stadsbibliotek",
  "folkungagatan": "Linköpings Stadsbibliotek",
  "gamla linköping": "Gamla Linköping",
  "saab arena": "Saab Arena",
  "linköping arena": "Linköping Arena",
  "consert & kongress": "Linköpings Konsert & Kongress",
  "trädgårdsföreningen": "Trädgårdsföreningen",
  "flygvapenmuseum": "Flygvapenmuseum",
  "domkyrkan": "Domkyrkan",
  "stora torget": "Stora Torget",
};

async function getOrCreateVenue(name: string, address?: string) {
  // Try to find existing venue
  let venue = await prisma.venue.findFirst({
    where: { name: { contains: name } },
  });

  if (venue) return venue;

  // Create new venue with Linköping coordinates
  const coords = {
    lat: 58.4108 + (Math.random() - 0.5) * 0.05,
    lng: 15.6214 + (Math.random() - 0.5) * 0.05,
  };

  return prisma.venue.create({
    data: {
      name,
      address: address || `${name}, Linköping`,
      city: "Linköping",
      ...coords,
    },
  });
}

function parseSwedishDate(dateStr: string): Date {
  // Handle various Swedish date formats
  const cleanDate = dateStr
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  // Try common patterns
  const patterns = [
    /(\d{1,2})\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\s+(\d{4})/i,
    /(\d{1,2})\/(\d{1,2})\s+(\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
  ];

  for (const pattern of patterns) {
    const match = cleanDate.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        // Swedish month name
        const months: Record<string, number> = {
          januari: 0, februari: 1, mars: 2, april: 3, maj: 4, juni: 5,
          juli: 6, augusti: 7, september: 8, oktober: 9, november: 10, december: 11
        };
        return new Date(parseInt(match[3]), months[match[2]], parseInt(match[1]));
      } else if (pattern === patterns[1]) {
        // DD/MM/YYYY
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      } else {
        // ISO date
        return new Date(match[0]);
      }
    }
  }

  // Fallback to current date
  console.warn(`Could not parse date: ${dateStr}`);
  return new Date();
}

function extractTags(title: string, description?: string): string[] {
  const text = `${title} ${description || ""}`.toLowerCase();
  const tags: string[] = [];

  const tagMap: Record<string, string> = {
    "barn": "barnvänligt",
    "familj": "barnvänligt",
    "barnvänlig": "barnvänligt",
    "gratis": "gratis",
    "fri": "gratis",
    "kostnadsfritt": "gratis",
    "utomhus": "utomhus",
    "ute": "utomhus",
    "park": "utomhus",
    "inomhus": "inomhus",
    "kultur": "kultur",
    "musik": "musik",
    "konst": "kultur",
    "teater": "teater",
    "föreläsning": "kultur",
    "sport": "sport",
    "idrott": "sport",
    "träning": "sport",
    "workshop": "workshop",
    "kurs": "workshop",
    "mat": "mat",
    "matmarknad": "mat",
    "loppis": "loppis",
    "marknad": "loppis",
  };

  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (text.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags;
}

async function scrapeLinkopingEvents() {
  console.log("🔍 Starting scrape of Visit Linköping...");

  try {
    const baseUrl = "https://visitlinkoping.se/wp-content/themes/itc/assets/blocks/post-feed/xhr/";
    const seenEvents = new Set<string>(); // Deduplication

    for (let page = 1; page <= 10; page++) { // Max 10 pages as safety
      console.log(`📄 Fetching page ${page}...`);

      const formData = new URLSearchParams({
        action: "site_query",
        paged: page.toString(),
        args: JSON.stringify({
          post_type: "events",
          taxonomies: ["event_cat", "event_tag", "internal_cat", "music", "theater_and_ent", "sport", "family", "festivals", "event_type"],
          posts_per_page: "12",
          post__in: false,
          post__not_in: [],
          post_parent: false,
          author_id: false,
          date_query: false,
          search: {
            taxonomies: [],
            meta: false,
            date: false,
            order: false,
          },
          template_layout: false,
          per_row: 3,
          heading: "h3",
        }),
      });

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "Mozilla/5.0 (compatible; LinkopingEventsBot/1.0)",
          "Origin": "https://visitlinkoping.se",
          "Referer": "https://visitlinkoping.se/evenemang/",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page ${page}: ${response.status}`);
      }

      const respText = await response.text();
      console.log(`🔍 Response preview: ${respText.substring(0, 200)}...`);
      
      const [countStr, html] = respText.split("|", 2);

      if (!html || html.trim() === "") {
        console.log(`🏁 No more events on page ${page}`);
        break;
      }

      const $ = cheerio.load(html);
      let newEventsOnPage = 0;

      $(".post-item").each((index, element) => {
        const $el = $(element);
        
        // Extract event data
        const title = $el.find("p.post-item__item-title").first().text().trim();
        const category = $el.find("span.event-type").first().text().trim();
        const datetime = $el.find("time[datetime]").first().attr("datetime");
        const dateText = $el.find("time").first().text().trim();
        const location = $el.find("li.list-item--address").first().text().trim();
        const price = $el.find("li.list-item--price").first().text().trim();
        const detailLink = $el.find("a.post-item__main-link").first().attr("href");
        const ticketLink = $el.find(".post-item__ticket-area a.ticket-url").first().attr("href");

        // Skip images from Visit Linköping - they use lazy loading with JS-only URLs
        // We'll use placeholders instead which look cleaner than broken images
        const imageUrl = undefined;

        if (!title || !datetime) {
          console.warn(`⚠️  Missing title or datetime for event: ${title || "unknown"}`);
          return;
        }

        // Deduplication by detail link
        const eventKey = detailLink || `${title}-${datetime}`;
        if (seenEvents.has(eventKey)) {
          return;
        }
        seenEvents.add(eventKey);

        // Parse date
        const startAt = new Date(datetime);
        if (isNaN(startAt.getTime())) {
          console.warn(`⚠️  Invalid date: ${datetime}`);
          return;
        }

        // Extract tags from category and title
        const tags = extractTags(title, category);

        // Build venue
        let venueName = location || "Okänd plats";
        if (venueName === "") {
          venueName = "Okänd plats";
        }

        // Map known venues
        const venueMap: Record<string, string> = {
          "saab arena": "Saab Arena",
          "linköping arena": "Linköping Arena",
          "stadsbiblioteket": "Linköpings Stadsbibliotek",
          "flygvapenmuseum": "Flygvapenmuseum",
          "gamla linköping": "Gamla Linköping",
          "konsert & kongress": "Linköpings Konsert & Kongress",
        };

        const mappedVenue = Object.entries(venueMap).find(([key]) => 
          venueName.toLowerCase().includes(key)
        )?.[1] || venueName;

        // Build external URL
        const externalUrl = detailLink ? 
          (detailLink.startsWith("http") ? detailLink : `https://visitlinkoping.se${detailLink}`) :
          undefined;

        // Determine if free
        const isFree = price?.toLowerCase().includes("gratis") || 
                       price?.toLowerCase().includes("fri") ||
                       category?.toLowerCase().includes("gratis");

        console.log(`📅 Found: ${title} at ${mappedVenue} on ${startAt.toLocaleDateString("sv-SE")}`);

        // Save to database
        saveEventToDatabase({
          title,
          description: undefined, // Visit Linköping doesn't show descriptions in list
          startAt,
          venueName: mappedVenue,
          tags,
          externalUrl,
          imageUrl,
          isFree,
        });

        newEventsOnPage++;
      });

      console.log(`✅ Page ${page}: ${newEventsOnPage} new events`);

      if (newEventsOnPage === 0) {
        console.log("🏁 No new events found, stopping pagination");
        break;
      }
    }

    console.log("🎉 Scrape completed!");
  } catch (error) {
    console.error("💥 Scrape failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Geocoding function to get coordinates from address
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  try {
    // Use Nominatim (OpenStreetMap) for free geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          "User-Agent": "LinkopingEvents/1.0",
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.length === 0) {
      console.warn(`⚠️  No coordinates found for address: ${address}`);
      return { lat: 58.4108, lng: 15.6214 }; // Fallback to Linköping center
    }
    
    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  } catch (error) {
    console.warn(`⚠️  Geocoding error for ${address}:`, error);
    return { lat: 58.4108, lng: 15.6214 }; // Fallback to Linköping center
  }
}

// Real coordinates for Linköping venues (fallback)
const venueCoordinates: Record<string, { lat: number; lng: number }> = {
  "saab arena": { lat: 58.4019, lng: 15.6215 },
  "linköping arena": { lat: 58.4019, lng: 15.6215 },
  "linköpings konsert & kongress": { lat: 58.4106, lng: 15.6214 },
  "linköpings sporthall": { lat: 58.3989, lng: 15.6281 },
  "stadsbiblioteket": { lat: 58.4108, lng: 15.6214 },
  "flygvapenmuseum": { lat: 58.5859, lng: 15.5455 },
  "gamla linköping": { lat: 58.4014, lng: 15.6229 },
  "stora torget": { lat: 58.4108, lng: 15.6214 },
  "palatset": { lat: 58.4106, lng: 15.6214 },
  "vreta kloster bryggeri": { lat: 58.5886, lng: 15.5489 },
  "berzeliusskolan": { lat: 58.4108, lng: 15.6214 },
  "babettes kulturpalats": { lat: 58.4106, lng: 15.6214 },
  "kvarteret folk": { lat: 58.4108, lng: 15.6214 },
  "stadsmissionens café": { lat: 58.4108, lng: 15.6214 },
  "nya munken": { lat: 58.4108, lng: 15.6214 },
};

async function saveEventToDatabase(eventData: {
  title: string;
  description?: string;
  startAt: Date;
  venueName: string;
  tags: string[];
  externalUrl?: string;
  imageUrl?: string;
  isFree?: boolean;
}) {
  try {
    // Find or create venue
    let venue = await prisma.venue.findFirst({
      where: { name: { contains: eventData.venueName } },
    });

    if (!venue) {
      // Try to geocode the address first, then fallback to known coordinates
      const fullAddress = `${eventData.venueName}, Linköping`;
      let coords = await geocodeAddress(fullAddress);
      
      // If geocoding failed or gave center coordinates, try known venues
      if (Math.abs(coords.lat - 58.4108) < 0.001 && Math.abs(coords.lng - 15.6214) < 0.001) {
        coords = venueCoordinates[eventData.venueName.toLowerCase()] || coords;
      }

      venue = await prisma.venue.create({
        data: {
          name: eventData.venueName,
          address: fullAddress,
          city: "Linköping",
          ...coords,
        },
      });

      console.log(`📍 Created venue: ${eventData.venueName} at ${coords.lat}, ${coords.lng}`);
    }

    // Check if event already exists
    const existing = await prisma.event.findFirst({
      where: {
        title: eventData.title,
        startAt: eventData.startAt,
        venueId: venue.id,
      },
    });

    if (existing) {
      console.log(`⏭️  Event already exists: ${eventData.title}`);
      return;
    }

    // Create event
    await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        startAt: eventData.startAt,
        venueId: venue.id,
        lat: venue.lat,
        lng: venue.lng,
        tags: eventData.tags,
        externalUrl: eventData.externalUrl,
        imageUrl: eventData.imageUrl,
        isFree: eventData.isFree,
        status: "published",
      },
    });

    console.log(`✅ Created event: ${eventData.title}`);
  } catch (error) {
    console.error(`❌ Failed to save event: ${eventData.title}`, error);
  }
}

// Run scraper
if (require.main === module) {
  scrapeLinkopingEvents();
}

export { scrapeLinkopingEvents };
