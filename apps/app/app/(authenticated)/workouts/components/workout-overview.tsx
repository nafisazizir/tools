"use client";

import type { StravaActivity } from "@repo/database";
import { useSleepQuery } from "@/hooks/use-sleep-query";
import { ChartLineMultiple } from "./chart-placeholder";
import { SleepBarChart } from "./sleep-bar-chart";
import { StatsOverview } from "./stats-overview";
import { UnifiedSyncButton } from "./unified-sync-button";

const DAYS_TO_FETCH = 14;

type WorkoutOverviewProps = {
  activities: StravaActivity[];
  athleteId?: string;
  garminConnected: boolean;
};

export const WorkoutOverview = ({
  activities,
  athleteId,
  garminConnected,
}: WorkoutOverviewProps) => {
  const { data: sleepResponse, isLoading: isSleepLoading } =
    useSleepQuery(DAYS_TO_FETCH);
  const sleepData = sleepResponse?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-muted-foreground text-sm">Overview</h3>
        <UnifiedSyncButton
          athleteId={athleteId}
          garminConnected={garminConnected}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatsOverview activities={activities} />
        {garminConnected && (
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <h4 className="font-medium text-sm">Sleep</h4>
            </div>
            <SleepBarChart isLoading={isSleepLoading} sleepData={sleepData} />
          </div>
        )}

        <ChartLineMultiple />
      </div>
    </div>
  );
};
