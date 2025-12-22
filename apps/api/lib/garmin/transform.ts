/** biome-ignore-all lint/style/noMagicNumbers: sleep score */
import type { Prisma } from "@repo/database";
import type { GarminSleepResponse, SleepDataSummary } from "./types";

const SECONDS_PER_HOUR = 3600;

export function sleepResponseToPrisma(
  dateStr: string,
  response: GarminSleepResponse
): Prisma.GarminSleepCreateInput {
  const dto = response.dailySleepDTO;

  return {
    id: dateStr,
    sleepScore: dto.sleepScores?.overall?.value ?? null,
    totalSleepSeconds: dto.sleepTimeSeconds,
    deepSleepSeconds: dto.deepSleepSeconds ?? null,
    lightSleepSeconds: dto.lightSleepSeconds ?? null,
    remSleepSeconds: dto.remSleepSeconds ?? null,
    awakeSleepSeconds: dto.awakeSleepSeconds ?? null,
    unmeasurableSeconds: dto.unmeasurableSleepSeconds ?? null,
    sleepStartTime: new Date(dto.sleepStartTimestampGMT),
    sleepEndTime: new Date(dto.sleepEndTimestampGMT),
    restlessMomentsCount: response.restlessMomentsCount ?? null,
    avgSleepStress: dto.avgSleepStress ?? null,
    sleepLevels: response.sleepLevels
      ? (response.sleepLevels as unknown as Prisma.InputJsonValue)
      : undefined,
    sleepMovement: response.sleepMovement
      ? (response.sleepMovement as unknown as Prisma.InputJsonValue)
      : undefined,
    rawSleepDTO: response as unknown as Prisma.InputJsonValue,
    lastSyncedAt: new Date(),
  };
}

export function sleepRecordToSummary(record: {
  id: string;
  sleepScore: number | null;
  totalSleepSeconds: number;
  deepSleepSeconds: number | null;
  lightSleepSeconds: number | null;
  remSleepSeconds: number | null;
  awakeSleepSeconds: number | null;
  sleepStartTime: Date;
  sleepEndTime: Date;
}): SleepDataSummary {
  const totalHours = record.totalSleepSeconds / SECONDS_PER_HOUR;

  let quality: SleepDataSummary["quality"];
  if (record.sleepScore === null) {
    quality = "fair";
  } else if (record.sleepScore >= 80) {
    quality = "excellent";
  } else if (record.sleepScore >= 60) {
    quality = "good";
  } else if (record.sleepScore >= 40) {
    quality = "fair";
  } else {
    quality = "poor";
  }

  return {
    date: record.id,
    sleepScore: record.sleepScore,
    totalHours: Math.round(totalHours * 100) / 100,
    deepHours: (record.deepSleepSeconds ?? 0) / SECONDS_PER_HOUR,
    lightHours: (record.lightSleepSeconds ?? 0) / SECONDS_PER_HOUR,
    remHours: (record.remSleepSeconds ?? 0) / SECONDS_PER_HOUR,
    awakeHours: (record.awakeSleepSeconds ?? 0) / SECONDS_PER_HOUR,
    sleepStart: record.sleepStartTime.toISOString(),
    sleepEnd: record.sleepEndTime.toISOString(),
    quality,
  };
}
