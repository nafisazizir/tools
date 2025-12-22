// Re-export types from garmin-connect package for convenience

export type {
  IGarminTokens,
  IOauth1Token as GarminOAuth1Token,
  IOauth2Token as GarminOAuth2Token,
} from "garmin-connect/dist/garmin/types";
export type {
  SleepData as GarminSleepResponse,
  SleepDTO as GarminDailySleepDTO,
  SleepLevels as GarminSleepLevelEntry,
  SleepMovement as GarminSleepMovementEntry,
} from "garmin-connect/dist/garmin/types/sleep";

export const GARMIN_SLEEP_LEVELS = {
  DEEP: 0,
  LIGHT: 1,
  REM: 2,
  AWAKE: 3,
  UNMEASURABLE: 4,
} as const;

export type GarminSleepLevel =
  (typeof GARMIN_SLEEP_LEVELS)[keyof typeof GARMIN_SLEEP_LEVELS];

export type SleepDataSummary = {
  date: string;
  sleepScore: number | null;
  totalHours: number;
  deepHours: number;
  lightHours: number;
  remHours: number;
  awakeHours: number;
  sleepStart: string;
  sleepEnd: string;
  quality: "poor" | "fair" | "good" | "excellent";
};
