import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Initialize Prisma with adapter
const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter});

// Demo events for Linköping (realistic examples)
const demoEvents = [
  {
    title: "Barnens söndag på Stadsbiblioteket",
    description: "Sagostund och pyssel för barn 3-6 år. Gratis kaffe till föräldrar.",
    startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    venueName: "Linköpings Stadsbibliotek",
    tags: ["barnvänligt", "kultur", "gratis"],
    externalUrl: "https://www.linkoping.se/stadsbiblioteket",
  },
  {
    title: "Jazzkväll på Jazzklubben",
    description: "Live jazz med lokala artister. Full bar och mat tillgänglig.",
    startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    venueName: "Jazzklubben",
    tags: ["kultur", "musik"],
    externalUrl: null,
  },
  {
    title: "Löpargrupp för nybörjare",
    description: "Lugn löpning i Ryd. Inga förkunskaper krävs. Ta med vattenflaska.",
    startAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    venueName: "Ryd Centrum",
    tags: ["sport", "gratis", "utomhus"],
    externalUrl: null,
  },
  {
    title: "Matmarknad på Stora Torget",
    description: "Lokala producenter säljer mat och hantverk. Live-musik 12-14.",
    startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    venueName: "Stora Torget",
    tags: ["mat", "gratis", "utomhus", "loppis"],
    externalUrl: null,
  },
  {
    title: "Konstutställning: Linköping i fokus",
    description: "Fotoutställning med bilder från Linköpings historia 1900-2000.",
    startAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
    venueName: "Linköpings Konsthall",
    tags: ["kultur", "konst", "gratis"],
    externalUrl: "https://www.linkoping.se/konsthall",
  },
];

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
  "linköpings stadsbibliotek": { lat: 58.4106, lng: 15.6213 }, // Östgötagatan 5
  "jazzklubben": { lat: 58.4108, lng: 15.6214 },
  "ryd centrum": { lat: 58.3989, lng: 15.6281 },
  "stora torget": { lat: 58.4108, lng: 15.6214 },
  "linköpings konsthall": { lat: 58.4106, lng: 15.6214 },
};

async function addDemoEvents() {
  console.log("🎭 Adding demo events to Linköping...");

  try {
    for (const eventData of demoEvents) {
      // Find or create venue
      let venue = await prisma.venue.findFirst({
        where: { name: { contains: eventData.venueName } },
      });

      if (!venue) {
        // Try to geocode the address first, then fallback to known coordinates
        const fullAddress = `${eventData.venueName}, Linköping`;
        console.log(`🔍 Geocoding address: ${fullAddress}`);
        
        let coords = await geocodeAddress(fullAddress);
        console.log(`📍 Geocoded coordinates: ${coords.lat}, ${coords.lng}`);
        
        // If geocoding failed or gave center coordinates, try known venues
        if (Math.abs(coords.lat - 58.4108) < 0.001 && Math.abs(coords.lng - 15.6214) < 0.001) {
          console.log(`🔄 Using fallback coordinates for ${eventData.venueName}`);
          coords = venueCoordinates[eventData.venueName.toLowerCase()] || coords;
          console.log(`📍 Fallback coordinates: ${coords.lat}, ${coords.lng}`);
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
      } else {
        console.log(`📍 Using existing venue: ${venue.name} at ${venue.lat}, ${venue.lng}`);
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
        continue;
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
          status: "published",
        },
      });

      console.log(`✅ Created event: ${eventData.title}`);
    }

    console.log("🎉 Demo events added successfully!");
  } catch (error) {
    console.error("💥 Failed to add demo events:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run demo
if (require.main === module) {
  addDemoEvents();
}

export { addDemoEvents };
