import { database } from "@repo/database";
import { NextResponse } from "next/server";
import { sleepRecordToSummary } from "../../../lib/garmin";

const DEFAULT_LIMIT = 30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(
      searchParams.get("limit") ?? String(DEFAULT_LIMIT),
      10
    );
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const includeDetails = searchParams.get("details") === "true";

    const where: Record<string, unknown> = {};

    if (startDate || endDate) {
      where.sleepStartTime = {};
      if (startDate) {
        (where.sleepStartTime as Record<string, Date>).gte = new Date(
          startDate
        );
      }
      if (endDate) {
        (where.sleepStartTime as Record<string, Date>).lte = new Date(endDate);
      }
    }

    const sleepRecords = await database.garminSleep.findMany({
      where,
      orderBy: { sleepStartTime: "desc" },
      take: limit,
      select: includeDetails
        ? undefined
        : {
            id: true,
            sleepScore: true,
            totalSleepSeconds: true,
            deepSleepSeconds: true,
            lightSleepSeconds: true,
            remSleepSeconds: true,
            awakeSleepSeconds: true,
            sleepStartTime: true,
            sleepEndTime: true,
          },
    });

    const data = includeDetails
      ? sleepRecords
      : sleepRecords.map(sleepRecordToSummary);

    return NextResponse.json({
      success: true,
      count: sleepRecords.length,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch sleep data: ${error}` },
      { status: 500 }
    );
  }
}
