import {
  database,
  detailedActivityToPrisma,
  editableFieldsFromSummary,
  StravaClient,
  type StravaSportType,
  type StravaSummaryActivity,
  summaryActivityToPrisma,
} from "@repo/database";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";

const DEFAULT_INITIAL_SYNC_DAYS = 30;
const DEFAULT_EDIT_SCAN_WINDOW_DAYS = 7;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

const ACTIVITIES_PER_PAGE = 200;
const MAX_PAGE_LIMIT = 5;

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_SERVER_ERROR = 500;

const SPORT_TYPES_REQUIRING_DETAILED_DATA: ReadonlySet<StravaSportType> =
  new Set<StravaSportType>(["Run", "Ride", "Swim", "WeightTraining"]);

function calculateAfterTimestamp(daysBack: number): number {
  return Math.floor(
    Date.now() / MILLISECONDS_PER_SECOND -
      daysBack * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE
  );
}

async function determineAfterTimestamp(
  athleteId: string,
  initialSyncDays: number,
  editScanWindow: number
): Promise<number> {
  const lastActivity = await database.stravaActivity.findFirst({
    where: { athlete_id: athleteId },
    orderBy: { start_date: "desc" },
    select: { start_date: true },
  });

  if (!lastActivity) {
    log.info(
      `No existing activities found. Fetching last ${initialSyncDays} days`
    );
    return calculateAfterTimestamp(initialSyncDays);
  }

  const lastActivityTimestamp = Math.floor(
    lastActivity.start_date.getTime() / MILLISECONDS_PER_SECOND
  );
  const scanWindowSeconds =
    editScanWindow * HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE;
  const afterTimestamp = lastActivityTimestamp - scanWindowSeconds;

  log.info(
    `Last activity: ${lastActivity.start_date.toISOString()}. Fetching from ${new Date(afterTimestamp * MILLISECONDS_PER_SECOND).toISOString()}`
  );

  return afterTimestamp;
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
}

async function processNewActivity(
  activity: StravaSummaryActivity,
  client: StravaClient
): Promise<void> {
  await database.stravaActivity.create({
    data: summaryActivityToPrisma(activity),
  });

  const needsDetailedData = SPORT_TYPES_REQUIRING_DETAILED_DATA.has(
    activity.sport_type
  );

  if (needsDetailedData) {
    await enrichWithDetailedData(client, activity.id.toString());
  }
}

async function processExistingActivity(
  activity: StravaSummaryActivity
): Promise<boolean> {
  const existingActivity = await database.stravaActivity.findUnique({
    where: { id: activity.id.toString() },
    select: {
      name: true,
      trainer: true,
      commute: true,
      private: true,
      gear_id: true,
      photo_count: true,
      total_photo_count: true,
    },
  });

  if (!existingActivity) {
    return false;
  }

  const hasChanges =
    existingActivity.name !== activity.name ||
    existingActivity.trainer !== activity.trainer ||
    existingActivity.commute !== activity.commute ||
    existingActivity.private !== activity.private ||
    existingActivity.gear_id !== activity.gear_id ||
    existingActivity.photo_count !== activity.photo_count ||
    existingActivity.total_photo_count !== activity.total_photo_count;

  if (!hasChanges) {
    return false;
  }

  await database.stravaActivity.update({
    where: { id: activity.id.toString() },
    data: editableFieldsFromSummary(activity),
  });

  return true;
}

async function getExistingActivityIds(
  athleteId: string,
  afterTimestamp: number
): Promise<Set<string>> {
  const activities = await database.stravaActivity.findMany({
    where: {
      athlete_id: athleteId,
      start_date: {
        gte: new Date(afterTimestamp * MILLISECONDS_PER_SECOND),
      },
    },
    select: { id: true },
  });

  return new Set(activities.map((a) => a.id));
}

async function handleDeletions(
  athleteId: string,
  stravaActivityIds: Set<string>,
  existingActivityIds: Set<string>
): Promise<number> {
  const deletedIds = Array.from(existingActivityIds).filter(
    (id) => !stravaActivityIds.has(id)
  );

  if (deletedIds.length > 0) {
    log.info(
      `Deleting ${deletedIds.length} activities for athlete ${athleteId}`
    );
    await database.stravaActivity.deleteMany({
      where: {
        id: { in: deletedIds },
      },
    });
  }

  return deletedIds.length;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      athleteId,
      initialSyncDays = DEFAULT_INITIAL_SYNC_DAYS,
      editScanWindow = DEFAULT_EDIT_SCAN_WINDOW_DAYS,
    } = body;

    if (!athleteId) {
      return NextResponse.json(
        { error: "athleteId is required" },
        { status: HTTP_STATUS_BAD_REQUEST }
      );
    }

    log.info(`Starting Strava sync for athlete ${athleteId}`);

    const client = new StravaClient(athleteId);

    const afterTimestamp = await determineAfterTimestamp(
      athleteId,
      initialSyncDays,
      editScanWindow
    );

    const existingActivityIds = await getExistingActivityIds(
      athleteId,
      afterTimestamp
    );

    const allActivities = await fetchAllActivities(
      client,
      afterTimestamp,
      athleteId
    );

    log.info(
      `Fetched ${allActivities.length} activities for athlete ${athleteId}`
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const stravaActivityIds = new Set<string>();
    for (const activity of allActivities) {
      const activityId = activity.id.toString();
      stravaActivityIds.add(activityId);

      try {
        const isNew = !existingActivityIds.has(activityId);

        if (isNew) {
          await processNewActivity(activity, client);
          created++;
        } else {
          const wasUpdated = await processExistingActivity(activity);
          if (wasUpdated) {
            updated++;
          } else {
            skipped++;
          }
        }
      } catch (error) {
        errors++;
        log.error(`Failed to sync activity ${activityId}: ${error}`);
      }
    }

    const deleted = await handleDeletions(
      athleteId,
      stravaActivityIds,
      existingActivityIds
    );

    log.info(
      `Sync complete for athlete ${athleteId}: ${created} created, ${updated} updated, ${skipped} skipped (no changes), ${deleted} deleted, ${errors} errors`
    );

    return NextResponse.json({
      success: true,
      created,
      updated,
      deleted,
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
