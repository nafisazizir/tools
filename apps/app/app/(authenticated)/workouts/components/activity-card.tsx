"use client";

import type { StravaActivity } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { cn } from "@repo/design-system/lib/utils";
import { ChevronDown, ChevronUp, Heart } from "lucide-react";
import { useState } from "react";
import { SportTypeIcon } from "@/components/sport-type-icon";
import { formatDuration, formatPace, METERS_PER_KM } from "./activity-utils";

type ActivityCardProps = {
  activity: StravaActivity;
};

type StatItemProps = {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
};

const StatItem = ({ label, value, unit, highlight }: StatItemProps) => (
  <div className="flex flex-col">
    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
      {label}
    </span>
    <div className="flex items-baseline gap-0.5">
      <span
        className={cn(
          "font-semibold tabular-nums",
          highlight ? "text-lg" : "text-base"
        )}
      >
        {value}
      </span>
      {unit && <span className="text-muted-foreground text-xs">{unit}</span>}
    </div>
  </div>
);

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const hasDescription =
    activity.description && activity.description.length > 0;

  return (
    <div className="group rounded-xl border bg-card p-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <SportTypeIcon
              className="size-5 text-foreground"
              sportType={activity.sport_type || "Default"}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 font-semibold text-sm leading-tight">
              {activity.name}
            </h3>
            <p className="mt-0.5 text-muted-foreground text-xs">
              {date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
              <span className="mx-1.5 opacity-50">·</span>
              {date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
        </div>

        {activity.has_heartrate && activity.average_heartrate && (
          <Badge
            className="shrink-0 gap-1 bg-rose-500/10 text-rose-600 dark:text-rose-400"
            variant="secondary"
          >
            <Heart className="size-3" />
            {activity.average_heartrate.toFixed(0)}
          </Badge>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {distance && (
          <StatItem highlight label="Distance" unit="km" value={distance} />
        )}
        {duration && <StatItem label="Time" value={duration} />}
        {pace && <StatItem label="Pace" value={pace} />}
      </div>

      {hasDescription && (
        <div className="mt-3 border-t pt-3">
          <button
            className="flex w-full items-center justify-between text-muted-foreground text-xs transition-colors hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
            type="button"
          >
            <span>Notes</span>
            {isExpanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
          {isExpanded && (
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground text-sm">
              {activity.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
