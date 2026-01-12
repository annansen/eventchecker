import { PrismaClient } from "@prisma/client";

// Initialize Prisma
const prisma = new PrismaClient();

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
