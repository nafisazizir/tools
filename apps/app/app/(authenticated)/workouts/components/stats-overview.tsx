"use client";

import type { StravaActivity } from "@repo/database";
import { cn } from "@repo/design-system/lib/utils";
import { Activity, Clock, Flame, Route } from "lucide-react";
import { formatDuration, METERS_PER_KM } from "./activity-utils";

const KILOJOULES_TO_KCAL = 0.239_006;

type StatsOverviewProps = {
  activities: StravaActivity[];
};

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  className?: string;
};

const StatCard = ({
  icon,
  label,
  value,
  subValue,
  className,
}: StatCardProps) => (
  <div
    className={cn(
      "group relative flex flex-col gap-1.5 rounded-xl bg-muted/50 p-4 transition-colors hover:bg-muted/80",
      className
    )}
  >
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="font-mono text-[10px] uppercase">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="font-mono text-2xl tabular-nums tracking-tight">
        {value}
      </span>
      {subValue && (
        <span className="font-mono text-muted-foreground text-xs">
          {subValue}
        </span>
      )}
    </div>
  </div>
);

export const StatsOverview = ({ activities }: StatsOverviewProps) => {
  const totalActivities = activities.length;

  const totalDistance = activities.reduce(
    (sum, a) => sum + (a.distance || 0),
    0
  );

  const totalTime = activities.reduce(
    (sum, a) => sum + (a.moving_time || 0),
    0
  );

  const totalCalories = activities.reduce(
    (sum, a) => sum + (a.kilojoules ? a.kilojoules * KILOJOULES_TO_KCAL : 0),
    0
  );

  const distanceKm = (totalDistance / METERS_PER_KM).toFixed(1);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<Activity className="size-4" />}
        label="Activities"
        value={totalActivities.toString()}
      />
      <StatCard
        icon={<Route className="size-4" />}
        label="Distance"
        subValue="km"
        value={distanceKm}
      />
      <StatCard
        icon={<Clock className="size-4" />}
        label="Time"
        value={formatDuration(totalTime)}
      />
      <StatCard
        icon={<Flame className="size-4" />}
        label="Calories"
        subValue="kcal"
        value={
          totalCalories > 0 ? Math.round(totalCalories).toLocaleString() : "—"
        }
      />
    </div>
  );
};
