"use client";

import { cn } from "@repo/design-system/lib/utils";
import type { SleepDataSummary } from "@/hooks/use-sleep-query";

type SleepChartTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: SleepDataSummary & { dayLabel: string };
  }>;
};

const qualityColors: Record<SleepDataSummary["quality"], string> = {
  excellent: "text-green-500",
  good: "text-blue-500",
  fair: "text-yellow-500",
  poor: "text-red-500",
};

const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) {
    return `${m}m`;
  }
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
};

export const SleepChartTooltip = ({
  active,
  payload,
}: SleepChartTooltipProps) => {
  if (!(active && payload?.length)) {
    return null;
  }

  const data = payload[0].payload;
  const date = new Date(data.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-w-[180px] rounded-lg border bg-background p-3 shadow-xl">
      <div className="mb-2 font-medium text-sm">{formattedDate}</div>

      {data.sleepScore !== null && (
        <div className="mb-2 flex items-center justify-between border-b pb-2">
          <span className="text-muted-foreground text-xs">Sleep Score</span>
          <span className={cn("font-semibold", qualityColors[data.quality])}>
            {data.sleepScore} ({data.quality})
          </span>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs">Total</span>
        <span className="font-medium text-sm">
          {formatHours(data.totalHours)}
        </span>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-blue-600" />
            <span className="text-muted-foreground">Deep</span>
          </div>
          <span>{formatHours(data.deepHours)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-cyan-400" />
            <span className="text-muted-foreground">Light</span>
          </div>
          <span>{formatHours(data.lightHours)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-purple-500" />
            <span className="text-muted-foreground">REM</span>
          </div>
          <span>{formatHours(data.remHours)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-sm bg-orange-400" />
            <span className="text-muted-foreground">Awake</span>
          </div>
          <span>{formatHours(data.awakeHours)}</span>
        </div>
      </div>
    </div>
  );
};
