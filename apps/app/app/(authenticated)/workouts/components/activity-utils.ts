export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
export const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
export const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;
export const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;
export const METERS_PER_KM = 1000;

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / 60);
  const remainingSeconds = Math.floor(seconds % SECONDS_PER_MINUTE);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatDateTime(date: Date): string {
  const timeString = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })} at ${timeString}`;
}

export function formatDistance(meters: number | null): string | null {
  if (!meters) {
    return null;
  }
  return (meters / METERS_PER_KM).toFixed(2);
}

export function formatElevation(meters: number | null): string | null {
  if (!meters) {
    return null;
  }
  return Math.round(meters).toString();
}

export function formatHeartRate(bpm: number | null | undefined): string | null {
  if (!bpm) {
    return null;
  }
  return bpm.toFixed(0);
}

export function formatCalories(cal: number | null | undefined): string | null {
  if (!cal) {
    return null;
  }
  return Math.round(cal).toString();
}

const METERS_PER_100M = 100;
const KM_PER_100M = 10;

export function formatSwimPace(
  movingTime: number | null,
  distance: number | null
): string | null {
  if (!movingTime) {
    return null;
  }
  if (!distance) {
    return null;
  }
  const secondsPer100m = (movingTime / distance) * METERS_PER_100M;
  return formatPace(secondsPer100m * KM_PER_100M);
}
