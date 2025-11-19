import { database, type Prisma } from "@repo/database";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";

const MIN_LIMIT_ACTIVITIES = 200;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get("athleteId");
    const limit = Number.parseInt(searchParams.get("limit") || "30", 10);
    const type = searchParams.get("type");

    if (!athleteId) {
      return NextResponse.json(
        { error: "athleteId is required" },
        { status: 400 }
      );
    }

    const where: Prisma.StravaActivityWhereInput = { athlete_id: athleteId };
    if (type) {
      where.type = type;
    }

    const activities = await database.stravaActivity.findMany({
      where,
      orderBy: { start_date: "desc" },
      take: Math.min(limit, MIN_LIMIT_ACTIVITIES),
    });

    return NextResponse.json(activities);
  } catch (error) {
    log.error(`Failed to export activities: ${error}`);
    return NextResponse.json(
      { error: "Failed to export activities" },
      { status: 500 }
    );
  }
}
