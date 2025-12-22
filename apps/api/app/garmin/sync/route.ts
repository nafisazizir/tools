import { database } from "@repo/database";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";
import { GarminClient, sleepResponseToPrisma } from "../../../lib/garmin";

const DEFAULT_SYNC_DAYS = 14;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const MS_PER_DAY =
  HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { days = DEFAULT_SYNC_DAYS } = body;

    const connection = await database.garminConnection.findUnique({
      where: { id: 1 },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Garmin not connected" },
        { status: 400 }
      );
    }

    log.info(`Starting Garmin sleep sync for last ${days} days`);

    const client = new GarminClient();

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * MS_PER_DAY);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];

      try {
        const sleepData = await client.getSleepData(new Date(current));

        if (sleepData?.dailySleepDTO) {
          await database.garminSleep.upsert({
            where: { id: dateStr },
            update: sleepResponseToPrisma(dateStr, sleepData),
            create: sleepResponseToPrisma(dateStr, sleepData),
          });
          synced++;
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        log.warn(`Failed to sync sleep for ${dateStr}: ${error}`);
      }

      current.setDate(current.getDate() + 1);
    }

    await database.garminConnection.update({
      where: { id: 1 },
      data: {
        lastSuccessfulSync: new Date(),
        lastError: errors > 0 ? `${errors} days failed to sync` : null,
      },
    });

    log.info(
      `Garmin sync complete: ${synced} synced, ${skipped} skipped, ${errors} errors`
    );

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      errors,
      total: days,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Garmin sync failed: ${message}`);

    await database.garminConnection
      .update({
        where: { id: 1 },
        data: { lastError: message },
      })
      .catch(() => {
        // Ignore if connection doesn't exist
      });

    return NextResponse.json(
      { error: "Failed to sync sleep data", details: message },
      { status: 500 }
    );
  }
}
