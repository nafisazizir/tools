export type StravaTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};

export type StravaMetaAthlete = {
  id: number;
};

export const STRAVA_SPORT_TYPES = [
  "AlpineSki",
  "BackcountrySki",
  "Badminton",
  "Canoeing",
  "Crossfit",
  "EBikeRide",
  "Elliptical",
  "EMountainBikeRide",
  "Golf",
  "GravelRide",
  "Handcycle",
  "HighIntensityIntervalTraining",
  "Hike",
  "IceSkate",
  "InlineSkate",
  "Kayaking",
  "Kitesurf",
  "MountainBikeRide",
  "NordicSki",
  "Pickleball",
  "Pilates",
  "Racquetball",
  "Ride",
  "RockClimbing",
  "RollerSki",
  "Rowing",
  "Run",
  "Sail",
  "Skateboard",
  "Snowboard",
  "Snowshoe",
  "Soccer",
  "Squash",
  "StairStepper",
  "StandUpPaddling",
  "Surfing",
  "Swim",
  "TableTennis",
  "Tennis",
  "TrailRun",
  "Velomobile",
  "VirtualRide",
  "VirtualRow",
  "VirtualRun",
  "Walk",
  "WeightTraining",
  "Wheelchair",
  "Windsurf",
  "Workout",
  "Yoga",
] as const;

export type StravaSportType = (typeof STRAVA_SPORT_TYPES)[number];

export type StravaLatLng = [number, number];

export type StravaPolylineMap = {
  id: string;
  polyline?: string | null; // Only in detailed activity
  summary_polyline: string | null;
};

export type StravaPhotosSummaryPrimary = {
  id: number;
  source: number;
  unique_id: string;
  urls: string;
};

export type StravaPhotosSummary = {
  count: number;
  primary: StravaPhotosSummaryPrimary | null;
};

export type StravaSummaryGear = {
  id: string;
  resource_state: number; // 2 = summary, 3 = detail
  primary: boolean;
  name: string;
  distance: number; // meters
};

export type StravaMetaActivity = {
  id: number;
};

export type StravaSummarySegment = {
  id: number;
  name: string;
  activity_type: string | null; // deprecated ActivityType
  distance: number; // meters
  average_grade: number | null;
  maximum_grade: number | null;
  elevation_high: number | null;
  elevation_low: number | null;
  start_latlng: StravaLatLng | null;
  end_latlng: StravaLatLng | null;
  climb_category: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  private: boolean | null;
  hazardous: boolean | null;
  starred: boolean | null;
};

export type DetailedSegmentEffort = {
  id: number;
  activity_id: number;
  elapsed_time: number; // seconds
  moving_time: number; // seconds
  start_date: string; // ISO datetime
  start_date_local: string; // ISO datetime local
  distance: number; // meters
  is_kom: boolean;
  name: string;

  activity: StravaMetaActivity;
  athlete: StravaMetaAthlete;

  start_index: number;
  end_index: number;

  average_cadence: number | null;
  average_watts: number | null;
  device_watts: boolean | null;
  average_heartrate: number | null;
  max_heartrate: number | null;

  segment: StravaSummarySegment;

  kom_rank: number | null;
  pr_rank: number | null;
  hidden: boolean;
};

export type StravaSplit = {
  average_speed: number | null; // m/s
  distance: number; // meters
  elapsed_time: number; // seconds
  elevation_difference: number | null; // meters
  pace_zone: number | null;
  moving_time: number; // seconds
  split: number | null; // index of the split
};

export type StravaLap = {
  id: number;

  activity: StravaMetaActivity;
  athlete: StravaMetaAthlete;

  average_cadence: number | null;
  average_speed: number | null; // m/s
  max_speed: number | null; // m/s
  distance: number; // meters
  elapsed_time: number; // seconds
  moving_time: number; // seconds

  start_index: number;
  end_index: number;
  lap_index: number;

  name: string;
  pace_zone: number | null;
  split: number | null;

  start_date: string; // ISO datetime
  start_date_local: string; // ISO datetime local

  total_elevation_gain: number; // meters
};

export type StravaActivityZone = {
  score: number | null;
  distribution_buckets: string[] | null;
  type: "heartrate" | "power" | string;
  sensor_based: boolean | null;
  points: number | null;
  custom_zones: boolean | null;
  max: number | null;
};

export type StravaSummaryActivity = {
  id: number;
  external_id: string | null;
  upload_id: number | null;

  athlete: StravaMetaAthlete;

  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number;
  elev_high: number;
  elev_low: number;

  type: string | null; // deprecated
  sport_type: StravaSportType;

  start_date: string; // ISO datetime from API
  start_date_local: string; // ISO datetime local
  timezone: string;

  start_latlng: StravaLatLng | null;
  end_latlng: StravaLatLng | null;

  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  total_photo_count: number;

  map: StravaPolylineMap | null;

  device_name: string | null;
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;

  workout_type: number | null;
  upload_id_str: string | null;

  average_speed: number; // m/s
  max_speed: number; // m/s

  has_kudoed: boolean;
  hide_from_home: boolean;

  gear_id: string | null;

  kilojoules: number | null; // rides only
  average_watts: number | null; // rides only
  device_watts: boolean;
  max_watts: number | null; // rides with power meter
  weighted_average_watts: number | null;

  average_cadence: number | null;
  has_heartrate: boolean;
  average_heartrate: number | null;
  max_heartrate: number | null;
};

export type StravaDetailedActivity = {
  id: number;
  external_id: string | null;
  upload_id: number | null;

  athlete: StravaMetaAthlete;

  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number;
  elev_high: number;
  elev_low: number;

  type: string | null; // ActivityType (deprecated)
  sport_type: StravaSportType;

  start_date: string; // ISO datetime
  start_date_local: string; // ISO datetime local
  timezone: string;

  start_latlng: StravaLatLng | null;
  end_latlng: StravaLatLng | null;

  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  total_photo_count: number;

  map: StravaPolylineMap | null;

  device_name: string | null;
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;

  workout_type: number | null;
  upload_id_str: string | null;

  average_speed: number; // m/s
  max_speed: number; // m/s

  has_kudoed: boolean;
  hide_from_home: boolean;

  gear_id: string | null;

  kilojoules: number | null; // rides only
  average_watts: number | null; // rides only
  device_watts: boolean;
  max_watts: number | null;
  weighted_average_watts: number | null;

  description: string | null;

  photos: StravaPhotosSummary | null;
  gear: StravaSummaryGear | null;
  calories: number | null;

  segment_efforts: DetailedSegmentEffort[];
  embed_token: string | null;

  splits_metric: StravaSplit[] | null;
  splits_standard: StravaSplit[] | null;
  laps: StravaLap[] | null;
  best_efforts: DetailedSegmentEffort[] | null;
};
