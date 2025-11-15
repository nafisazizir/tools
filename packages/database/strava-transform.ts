import { Prisma } from "./generated/client";
import type {
  StravaActivityZone,
  StravaDetailedActivity,
  StravaSummaryActivity,
} from "./strava-types";

export function summaryActivityToPrisma(
  activity: StravaSummaryActivity
): Prisma.StravaActivityCreateInput {
  return {
    id: activity.id.toString(),
    external_id: activity.external_id,
    upload_id: activity.upload_id?.toString() ?? null,
    upload_id_str: activity.upload_id_str,

    athlete_id: activity.athlete.id.toString(),

    name: activity.name,
    type: activity.type,
    sport_type: activity.sport_type,

    start_date: new Date(activity.start_date),
    start_date_local: new Date(activity.start_date_local),
    timezone: activity.timezone,

    distance: activity.distance,
    moving_time: activity.moving_time,
    elapsed_time: activity.elapsed_time,
    total_elevation_gain: activity.total_elevation_gain,
    elev_high: activity.elev_high,
    elev_low: activity.elev_low,

    average_speed: activity.average_speed,
    max_speed: activity.max_speed,

    average_watts: activity.average_watts,
    max_watts: activity.max_watts,
    weighted_average_watts: activity.weighted_average_watts,
    device_watts: activity.device_watts,
    kilojoules: activity.kilojoules,

    achievement_count: activity.achievement_count,
    kudos_count: activity.kudos_count,
    comment_count: activity.comment_count,
    athlete_count: activity.athlete_count,
    photo_count: activity.photo_count,
    total_photo_count: activity.total_photo_count,

    start_latlng: activity.start_latlng ?? Prisma.JsonNull,
    end_latlng: activity.end_latlng ?? Prisma.JsonNull,

    trainer: activity.trainer,
    commute: activity.commute,
    manual: activity.manual,
    private: activity.private,
    flagged: activity.flagged,
    has_kudoed: activity.has_kudoed,
    hide_from_home: activity.hide_from_home,

    workout_type: activity.workout_type,
    gear_id: activity.gear_id,
    device_name: activity.device_name,

    map: activity.map ?? Prisma.JsonNull,

    lastSyncedAt: new Date(),
  };
}

export function detailedActivityToPrisma(
  activity: StravaDetailedActivity,
  zones?: StravaActivityZone[]
): Prisma.StravaActivityUpdateInput {
  return {
    // Update summary fields (they might have changed)
    name: activity.name,
    distance: activity.distance,
    moving_time: activity.moving_time,
    elapsed_time: activity.elapsed_time,
    total_elevation_gain: activity.total_elevation_gain,
    elev_high: activity.elev_high,
    elev_low: activity.elev_low,

    average_speed: activity.average_speed,
    max_speed: activity.max_speed,

    average_watts: activity.average_watts,
    max_watts: activity.max_watts,
    weighted_average_watts: activity.weighted_average_watts,
    kilojoules: activity.kilojoules,

    achievement_count: activity.achievement_count,
    kudos_count: activity.kudos_count,
    comment_count: activity.comment_count,
    athlete_count: activity.athlete_count,
    photo_count: activity.photo_count,
    total_photo_count: activity.total_photo_count,

    // Detailed-only fields
    description: activity.description,
    calories: activity.calories,

    segment_efforts: activity.segment_efforts,
    best_efforts: activity.best_efforts ?? Prisma.JsonNull,

    laps: activity.laps ?? Prisma.JsonNull,
    splits_metric: activity.splits_metric ?? Prisma.JsonNull,
    splits_standard: activity.splits_standard ?? Prisma.JsonNull,

    photos: activity.photos ?? Prisma.JsonNull,
    gear: activity.gear ?? Prisma.JsonNull,

    zones,

    lastSyncedAt: new Date(),
  };
}

export function hasDetailedData(activity: {
  description?: string | null;
  calories?: number | null;
}): boolean {
  return !!(activity.description || activity.calories);
}
