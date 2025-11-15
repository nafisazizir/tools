import {
  database,
  detailedActivityToPrisma,
  StravaClient,
  type StravaSportType,
  type StravaSummaryActivity,
  summaryActivityToPrisma,
} from "@repo/database";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";

const DEFAULT_DAYS_BACK = 30;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;
const RECENT_CREATION_THRESHOLD_MS = 1000;

const ACTIVITIES_PER_PAGE = 200;
const MAX_PAGE_LIMIT = 5;

const RATE_LIMIT_DELAY_MS = 100;

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_SERVER_ERROR = 500;

const SPORT_TYPES_REQUIRING_DETAILED_DATA: ReadonlySet<StravaSportType> =
  new Set<StravaSportType>(["Run", "Ride", "Swim"]);

function calculateAfterTimestamp(daysBack: number): number {
  return Math.floor(
    Date.now() / MILLISECONDS_PER_SECOND -
      daysBack * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE
  );
}

async function fetchAllActivities(
  client: StravaClient,
  afterTimestamp: number,
  athleteId: string
): Promise<StravaSummaryActivity[]> {
  const allActivities: StravaSummaryActivity[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const activities = await client.getActivities(
      afterTimestamp,
      ACTIVITIES_PER_PAGE,
      page
    );

    if (activities.length === 0) {
      hasMore = false;
    } else {
      allActivities.push(...activities);
      page++;

      if (page > MAX_PAGE_LIMIT) {
        log.warn(`Reached page limit for athlete ${athleteId}`);
        hasMore = false;
      }
    }
  }

  return allActivities;
}

async function enrichWithDetailedData(
  client: StravaClient,
  activityId: string
): Promise<void> {
  const [detailedActivity, zones] = await Promise.all([
    client.getActivity(activityId),
    client.getActivityZones(activityId).catch((error) => {
      log.warn(`No zones available for activity ${activityId}: ${error}`);
      return null;
    }),
  ]);

  await database.stravaActivity.update({
    where: { id: activityId },
    data: detailedActivityToPrisma(detailedActivity, zones ?? undefined),
  });

  await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
}

async function processActivity(
  activity: StravaSummaryActivity,
  client: StravaClient
): Promise<"created" | "updated"> {
  const result = await database.stravaActivity.upsert({
    where: { id: activity.id.toString() },
    create: summaryActivityToPrisma(activity),
    update: summaryActivityToPrisma(activity),
    select: { createdAt: true },
  });

  const wasCreated =
    result.createdAt > new Date(Date.now() - RECENT_CREATION_THRESHOLD_MS);

  const needsDetailedData = SPORT_TYPES_REQUIRING_DETAILED_DATA.has(
    activity.sport_type
  );

  if (needsDetailedData) {
    await enrichWithDetailedData(client, activity.id.toString());
  }

  return wasCreated ? "created" : "updated";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { athleteId, daysBack = DEFAULT_DAYS_BACK } = body;

    if (!athleteId) {
      return NextResponse.json(
        { error: "athleteId is required" },
        { status: HTTP_STATUS_BAD_REQUEST }
      );
    }

    log.info(`Starting Strava sync for athlete ${athleteId}`);

    const client = new StravaClient(athleteId);
    const afterTimestamp = calculateAfterTimestamp(daysBack);
    const allActivities = await fetchAllActivities(
      client,
      afterTimestamp,
      athleteId
    );

    log.info(
      `Fetched ${allActivities.length} activities for athlete ${athleteId}`
    );

    let synced = 0;
    let updated = 0;
    let errors = 0;

    for (const activity of allActivities) {
      try {
        const result = await processActivity(activity, client);
        if (result === "created") {
          synced++;
        } else {
          updated++;
        }
      } catch (error) {
        errors++;
        log.error(`Failed to sync activity ${activity.id}: ${error}`);
      }
    }

    log.info(
      `Sync complete for athlete ${athleteId}: ${synced} new, ${updated} updated, ${errors} errors`
    );

    return NextResponse.json({
      success: true,
      synced,
      updated,
      errors,
      total: allActivities.length,
    });
  } catch (error) {
    log.error(`Strava sync failed: ${error}`);
    return NextResponse.json(
      {
        error: "Failed to sync activities",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: HTTP_STATUS_SERVER_ERROR }
    );
  }
}
