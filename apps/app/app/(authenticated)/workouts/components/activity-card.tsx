import type { StravaActivity } from "@repo/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { cn } from "@repo/design-system/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { getSportTypeIcon } from "@/lib/strava-sport-types";
import {
  formatDateTime,
  formatDuration,
  formatPace,
  METERS_PER_KM,
} from "./activity-utils";

type ActivityCardProps = {
  activity: StravaActivity;
};

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const date = new Date(activity.start_date_local);
  const distance = activity.distance
    ? (activity.distance / METERS_PER_KM).toFixed(2)
    : null;
  const duration = activity.moving_time
    ? formatDuration(activity.moving_time)
    : null;
  const pace =
    activity.moving_time && activity.distance
      ? formatPace(activity.moving_time / (activity.distance / METERS_PER_KM))
      : null;

  const iconSrc = activity.sport_type
    ? getSportTypeIcon(activity.sport_type)
    : "/icons/dumbbell-regular-full.svg";

  return (
    <Card className="gap-4 shadow-none" key={activity.id}>
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
              {formatDateTime(date)}
            </span>
            {activity.device_name && (
              <span className="text-muted-foreground text-sm">
                {activity.device_name}
              </span>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activity.description && (
          <div className="mb-4">
            <div
              className={cn(
                "overflow-hidden font-medium text-sm transition-all",
                isDescriptionExpanded ? "max-h-none" : "max-h-20"
              )}
            >
              <p className="whitespace-pre-wrap">{activity.description}</p>
            </div>
            <button
              className="mt-2 flex items-center gap-1 text-muted-foreground text-xs transition-colors hover:text-foreground"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              type="button"
            >
              {isDescriptionExpanded ? <>Show less</> : <>Read more</>}
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-4">
          {distance && (
            <div className="flex flex-col items-start">
              <span className="text-muted-foreground text-xs">Distance</span>
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
              <span className="text-muted-foreground text-xs">Avg HR</span>
              <span className="font-medium text-xl">
                {activity.average_heartrate.toFixed(0)} bpm
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
