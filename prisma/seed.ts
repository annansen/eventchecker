import { PrismaClient, type EventStatus } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { faker } from "@faker-js/faker/locale/sv";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

type VenueSeed = {
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
};

const venues: VenueSeed[] = [
  {
    name: "Linköpings Konsert & Kongress",
    address: "Konsistoriegatan 7, 582 22 Linköping",
    city: "Linköping",
    lat: 58.4148,
    lng: 15.6212,
  },
  {
    name: "Gamla Linköping",
    address: "Tunnbindaregatan 1, 582 46 Linköping",
    city: "Linköping",
    lat: 58.4104,
    lng: 15.6127,
  },
  {
    name: "Trädgårdsföreningen",
    address: "Trädgårdsgatan 15, 582 24 Linköping",
    city: "Linköping",
    lat: 58.4089,
    lng: 15.6176,
  },
  {
    name: "Linköpings Stadsbibliotek",
    address: "Östgötagatan 5, 582 32 Linköping",
    city: "Linköping",
    lat: 58.4109,
    lng: 15.6216,
  },
  {
    name: "Linköping Arena",
    address: "Kallerstadsvägen 1, 582 78 Linköping",
    city: "Linköping",
    lat: 58.4083,
    lng: 15.6676,
  },
  {
    name: "Saab Arena",
    address: "Stånggatan 1, 582 23 Linköping",
    city: "Linköping",
    lat: 58.4149,
    lng: 15.6482,
  },
  {
    name: "Stora Torget",
    address: "Stora Torget, 582 19 Linköping",
    city: "Linköping",
    lat: 58.4112,
    lng: 15.6221,
  },
  {
    name: "Stångån / Tinnerbäcken",
    address: "Stångån, Linköping",
    city: "Linköping",
    lat: 58.4066,
    lng: 15.6288,
  },
  {
    name: "Vallaskogen",
    address: "Vallaskogen, Linköping",
    city: "Linköping",
    lat: 58.3954,
    lng: 15.5768,
  },
  {
    name: "Flygvapenmuseum",
    address: "Carl Cederströms gata 2, 586 63 Linköping",
    city: "Linköping",
    lat: 58.4093,
    lng: 15.5247,
  },
];

const tagPool = [
  "barnvänligt",
  "gratis",
  "utomhus",
  "inomhus",
  "kultur",
  "sport",
  "musik",
  "teater",
  "workshop",
  "natur",
  "mat",
  "historia",
  "loppis",
  "föreläsning",
];

function randomFutureDateWithinDays(days: number) {
  const now = new Date();
  const max = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return faker.date.between({ from: now, to: max });
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  const venueCount = await prisma.venue.count();
  const eventCount = await prisma.event.count();

  if (venueCount > 0 || eventCount > 0) {
    console.log(
      `Seed skipped: database already has venues=${venueCount}, events=${eventCount}.`
    );
    return;
  }

  console.log("Seeding venues...");
  const createdVenues = await Promise.all(
    venues.map((v) => prisma.venue.create({ data: v }))
  );

  console.log("Seeding events...");
  const eventsToCreate = 45;

  const titles = [
    "Sagostund för små äventyrare",
    "Gratis utomhusyoga i parken",
    "Familjefotboll på gräset",
    "Konsert: Lokala band live",
    "Guidad historievandring i city",
    "Barnteater: Den försvunna nyckeln",
    "Workshop: Måla med akvarell",
    "Lördagspromenad i Vallaskogen",
    "Loppis & fika",
    "Street food-kväll",
    "Museidag med familjevisning",
    "Prova-på klättring",
    "Kulturkväll med poesi",
    "Picknick & spel vid ån",
  ];

  const descriptions = [
    "Kom som du är. Ta med en vän och upplev Linköping tillsammans!",
    "Ett lättsamt evenemang med bra stämning och plats för alla.",
    "Perfekt för familjer och nyfikna. Ingen föranmälan behövs.",
    "Ett skönt avbrott i vardagen med fokus på gemenskap.",
  ];

  for (let i = 0; i < eventsToCreate; i++) {
    const venue = faker.helpers.arrayElement(createdVenues);
    const startAt = randomFutureDateWithinDays(14);

    // snap start time to half-hours
    startAt.setMinutes(startAt.getMinutes() < 30 ? 0 : 30, 0, 0);

    const duration = faker.helpers.arrayElement([1, 1.5, 2, 3]);
    const endAt = addHours(startAt, duration);

    const isFree = faker.datatype.boolean({ probability: 0.45 });

    let priceMin: number | null = null;
    let priceMax: number | null = null;

    if (!isFree) {
      const base = faker.number.int({ min: 50, max: 220 });
      priceMin = base;
      priceMax = base + faker.number.int({ min: 0, max: 120 });
    }

    const tags = faker.helpers.arrayElements(
      tagPool,
      faker.number.int({ min: 1, max: 4 })
    );

    if (isFree && !tags.includes("gratis")) tags.push("gratis");

    const status: EventStatus = faker.helpers.arrayElement([
      "published",
      "published",
      "published",
      "draft",
    ]);

    await prisma.event.create({
      data: {
        title: faker.helpers.arrayElement(titles),
        description: faker.helpers.arrayElement(descriptions),
        startAt,
        endAt,
        venueId: venue.id,
        lat: venue.lat + faker.number.float({ min: -0.006, max: 0.006 }),
        lng: venue.lng + faker.number.float({ min: -0.006, max: 0.006 }),
        priceMin,
        priceMax,
        isFree,
        ageMin: faker.datatype.boolean({ probability: 0.25 })
          ? faker.number.int({ min: 0, max: 10 })
          : null,
        ageMax: faker.datatype.boolean({ probability: 0.2 })
          ? faker.number.int({ min: 11, max: 18 })
          : null,
        tags,
        externalUrl: faker.internet.url(),
        imageUrl: `https://picsum.photos/seed/${faker.string.uuid()}/800/600`,
        status,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
