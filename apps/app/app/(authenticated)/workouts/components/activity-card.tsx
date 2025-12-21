"use client";

import type { StravaActivity } from "@repo/database";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Heart } from "lucide-react";
import { SportTypeIcon } from "@/components/sport-type-icon";
import {
  formatCalories,
  formatDistance,
  formatDuration,
  formatElevation,
  formatHeartRate,
  formatPace,
  formatSwimPace,
  METERS_PER_KM,
} from "./activity-utils";

type ActivityCardProps = {
  activity: StravaActivity;
};

type StatItemProps = {
  label: string;
  value: string;
  unit?: string;
};

type MetricConfig = {
  label: string;
  getValue: (activity: StravaActivity) => string | null;
  unit?: string;
};

const METRICS = {
  Distance: {
    label: "Distance",
    getValue: (a: StravaActivity) => formatDistance(a.distance),
    unit: "km",
  },
  ElevGain: {
    label: "Elev Gain",
    getValue: (a: StravaActivity) => formatElevation(a.total_elevation_gain),
    unit: "m",
  },
  Time: {
    label: "Time",
    getValue: (a: StravaActivity) =>
      a.moving_time ? formatDuration(a.moving_time) : null,
  },
  Pace: {
    label: "Pace",
    getValue: (a: StravaActivity) => {
      if (!a.moving_time) {
        return null;
      }
      if (!a.distance) {
        return null;
      }
      return formatPace(a.moving_time / (a.distance / METERS_PER_KM));
    },
    unit: "/km",
  },
  SwimPace: {
    label: "Pace",
    getValue: (a: StravaActivity) => formatSwimPace(a.moving_time, a.distance),
    unit: "/100m",
  },
  AvgHR: {
    label: "Avg HR",
    getValue: (a: StravaActivity) => formatHeartRate(a.average_heartrate),
    unit: "bpm",
  },
  Calories: {
    label: "Cal",
    getValue: (a: StravaActivity) => formatCalories(a.calories),
  },
} as const satisfies Record<string, MetricConfig>;

const SPORT_TYPE_METRICS: Record<string, MetricConfig[]> = {
  Ride: [METRICS.Distance, METRICS.ElevGain, METRICS.Time],
  Run: [METRICS.Distance, METRICS.Pace, METRICS.Time],
  Walk: [METRICS.Distance, METRICS.Time],
  Yoga: [METRICS.Time, METRICS.AvgHR, METRICS.Calories],
  Swim: [{ ...METRICS.Distance, unit: "m" }, METRICS.Time, METRICS.SwimPace],
  Hike: [METRICS.Distance, METRICS.ElevGain, METRICS.Time],
  Workout: [METRICS.Time, METRICS.AvgHR, METRICS.Calories],
  WeightTraining: [METRICS.Time, METRICS.AvgHR, METRICS.Calories],
};

const DEFAULT_METRICS: MetricConfig[] = [
  METRICS.Time,
  METRICS.AvgHR,
  METRICS.Calories,
];

const StatItem = ({ label, value, unit }: StatItemProps) => (
  <div className="flex flex-col gap-0.5">
    <span className="font-mono text-[10px] text-muted-foreground uppercase">
      {label}
    </span>
    <div className="flex items-baseline gap-0.5">
      <span className="font-mono tabular-nums">{value}</span>
      {unit && (
        <span className="font-mono text-muted-foreground text-xs">{unit}</span>
      )}
    </div>
  </div>
);

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const date = new Date(activity.start_date_local);
  const metrics =
    SPORT_TYPE_METRICS[activity.sport_type || ""] ?? DEFAULT_METRICS;

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
            className="shrink-0 gap-1 bg-rose-500/10 font-mono text-rose-600 dark:text-rose-400"
            variant="secondary"
          >
            <Heart className="size-3" />
            {activity.average_heartrate.toFixed(0)}
          </Badge>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {metrics.map((metric) => {
          const value = metric.getValue(activity);
          if (!value) {
            return null;
          }
          return (
            <StatItem
              key={metric.label}
              label={metric.label}
              unit={metric.unit}
              value={value}
            />
          );
        })}
      </div>
    </div>
  );
};
