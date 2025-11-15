import { database } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import Image from "next/image";
import { getSportTypeIcon } from "@/lib/strava-sport-types";

type ActivitiesListProps = {
  athleteId: string;
};

export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;
export const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
export const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;
export const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;
export const METERS_PER_KM = 1000;

export const ActivitiesList = async ({ athleteId }: ActivitiesListProps) => {
  const activities = await database.stravaActivity.findMany({
    where: { athlete_id: athleteId },
    orderBy: { start_date: "desc" },
    take: 10,
  });

  if (activities.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image
              alt="Activities"
              className="h-5 w-5"
              height={20}
              src="/icons/dumbbell-regular-full.svg"
              width={20}
            />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Your latest workouts will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No activities synced yet. Click "Sync Activities" to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        // TODO: investigate why use start_date instead of start_date_local
        const date = new Date(activity.start_date); // start_date is actually in UTC, how to render in local time and get the timezone in: activity.timezone
        const distance = activity.distance
          ? (activity.distance / METERS_PER_KM).toFixed(2)
          : null;
        const duration = activity.moving_time
          ? formatDuration(activity.moving_time)
          : null;
        const pace =
          activity.moving_time && activity.distance
            ? formatPace(
                activity.moving_time / (activity.distance / METERS_PER_KM)
              )
            : null;

        const iconSrc = activity.sport_type
          ? getSportTypeIcon(activity.sport_type)
          : "/icons/dumbbell-regular-full.svg";

        return (
          <Card className="shadow-none" key={activity.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Image
                  alt={activity.sport_type || "sport_type"}
                  className="h-6 w-6"
                  height={24}
                  src={iconSrc}
                  width={24}
                />
                <h4 className="font-semibold text-xl leading-none">
                  {activity.name}
                </h4>
              </CardTitle>
              <CardDescription>
                <div className="flex flex-row gap-1">
                  <span className="text-muted-foreground text-sm">
                    {formatDateTime(date, activity.timezone.split(" ")[1])}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    Garmin Forerunner 965
                  </span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {distance && (
                  <div className="flex flex-col items-start">
                    <span className="text-muted-foreground text-xs">
                      Distance
                    </span>
                    <span className="font-medium text-xl">{distance} km</span>
                  </div>
                )}

                {pace && (
                  <div className="flex flex-col items-start">
                    <span className="text-muted-foreground text-xs">Pace</span>
                    <span className="font-medium text-xl">{pace}</span>
                  </div>
                )}

                {duration && (
                  <div className="flex flex-col items-start">
                    <span className="text-muted-foreground text-xs">Time</span>
                    <span className="font-medium text-xl">{duration}</span>
                  </div>
                )}

                {activity.has_heartrate && activity.average_heartrate && (
                  <div className="flex flex-col items-start">
                    <span className="text-muted-foreground text-xs">
                      Avg HR
                    </span>
                    <span className="font-medium text-xl">
                      {activity.average_heartrate.toFixed(0)} bpm
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / 60);
  const remainingSeconds = Math.floor(seconds % SECONDS_PER_MINUTE);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

function formatDateTime(date: Date, timeZone?: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / MS_PER_DAY);

  const timeString = date.toLocaleTimeString("en-US", {
    timeZone: timeZone || "Australia/Brisbane",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (diffDays === 0) {
    return `Today at ${timeString}`;
  }
  if (diffDays === 1) {
    return `Yesterday at ${timeString}`;
  }
  return `${date.toLocaleDateString("en-US", {
    timeZone: timeZone || "Australia/Brisbane",
    month: "long",
    day: "numeric",
    year: "numeric",
  })} at ${timeString}`;
}
