import { database, type Prisma, type StravaActivity } from "@repo/database";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";

const MIN_LIMIT_ACTIVITIES = 200;

function buildWhereClause(
  athleteId: string,
  type: string | null,
  startDate: string | null,
  endDate: string | null
): Prisma.StravaActivityWhereInput {
  const where: Prisma.StravaActivityWhereInput = { athlete_id: athleteId };

  if (type) {
    where.type = type;
  }

  if (startDate || endDate) {
    where.start_date = {};
    if (startDate) {
      where.start_date.gte = new Date(startDate);
    }
    if (endDate) {
      where.start_date.lte = new Date(endDate);
    }
  }

  return where;
}

function calculateStats(activities: StravaActivity[]) {
  const stats = {
    total: activities.length,
    types: {} as Record<string, number>,
    totalDistance: 0,
    totalTime: 0,
  };

  for (const activity of activities) {
    if (!activity.type) {
      continue;
    }
    stats.types[activity.type] = (stats.types[activity.type] || 0) + 1;
    stats.totalDistance += activity.distance || 0;
    stats.totalTime += activity.moving_time || 0;
  }

  return stats;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get("athleteId");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!athleteId) {
      return NextResponse.json(
        { error: "athleteId is required" },
        { status: 400 }
      );
    }

    const where = buildWhereClause(athleteId, type, startDate, endDate);

    const activities = await database.stravaActivity.findMany({
      where,
      orderBy: { start_date: "desc" },
      take: Math.min(limit, MIN_LIMIT_ACTIVITIES),
    });

    const stats = calculateStats(activities);

    return NextResponse.json({
      activities,
      stats,
      athleteId,
    });
  } catch (error) {
    log.error(`Failed to fetch activities: ${error}`);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
