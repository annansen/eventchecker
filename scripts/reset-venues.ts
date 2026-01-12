import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Initialize Prisma with adapter
const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter});

async function resetVenues() {
  console.log("🗑️  Resetting all venues...");

  try {
    // Delete all events first (they reference venues)
    await prisma.event.deleteMany({});
    console.log("✅ All events deleted");
    
    // Then delete all venues
    await prisma.venue.deleteMany({});
    console.log("✅ All venues deleted");

    // Close connection
    await prisma.$disconnect();
    console.log("🎉 Reset completed! Run 'npm run demo' to recreate with correct coordinates");
  } catch (error) {
    console.error("💥 Reset failed:", error);
    await prisma.$disconnect();
  }
}

// Run reset
if (require.main === module) {
  resetVenues();
}

export { resetVenues };
