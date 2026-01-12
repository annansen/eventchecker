import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Test database connection only if DATABASE_URL is set
    if (process.env.DATABASE_URL) {
      await prisma.$queryRaw`SELECT 1`;
      return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      });
    } else {
      return NextResponse.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "not_configured",
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
