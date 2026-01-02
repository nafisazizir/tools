"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  XAxis,
  YAxis,
} from "@repo/design-system/components/ui/chart";
import { cn } from "@repo/design-system/lib/utils";
import { ChevronLeft, ChevronRight, Moon } from "lucide-react";
import { useMemo, useState } from "react";
import type { SleepDataSummary } from "@/hooks/use-sleep-query";

const DAYS_IN_WEEK = 7;

type SleepBarChartProps = {
  sleepData: SleepDataSummary[];
  isLoading?: boolean;
};

const chartConfig = {
  deepHours: {
    label: "Deep",
    color: "var(--chart-1)",
  },
  lightHours: {
    label: "Light",
    color: "var(--chart-2)",
  },
  remHours: {
    label: "REM",
    color: "var(--chart-3)",
  },
  awakeHours: {
    label: "Awake",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const qualityColors: Record<string, string> = {
  excellent: "text-green-500",
  good: "text-blue-500",
  fair: "text-yellow-500",
  poor: "text-red-500",
};

const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const getDayLabel = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

export const SleepBarChart = ({ sleepData, isLoading }: SleepBarChartProps) => {
  const [weekOffset, setWeekOffset] = useState(0);

  const sortedData = useMemo(
    () =>
      [...sleepData].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [sleepData]
  );

  const totalDays = sortedData.length;
  const maxWeekOffset = Math.max(0, Math.ceil(totalDays / DAYS_IN_WEEK) - 1);

  const currentWeekData = useMemo(() => {
    const startIndex = Math.max(
      0,
      totalDays - DAYS_IN_WEEK - weekOffset * DAYS_IN_WEEK
    );
    const endIndex = Math.min(totalDays, startIndex + DAYS_IN_WEEK);
    return sortedData.slice(startIndex, endIndex).map((d) => ({
      ...d,
      dayLabel: getDayLabel(d.date),
    }));
  }, [sortedData, weekOffset, totalDays]);

  const canGoBack = weekOffset < maxWeekOffset;
  const canGoForward = weekOffset > 0;

  const handlePrevWeek = () => {
    if (canGoBack) {
      setWeekOffset((prev) => prev + 1);
    }
  };

  const handleNextWeek = () => {
    if (canGoForward) {
      setWeekOffset((prev) => prev - 1);
    }
  };

  const weekRangeLabel = useMemo(() => {
    if (currentWeekData.length === 0) {
      return "";
    }
    const firstDate = new Date(currentWeekData[0].date);
    const lastDate = new Date(currentWeekData.at(-1)?.date || "");
    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${formatDate(firstDate)} - ${formatDate(lastDate)}`;
  }, [currentWeekData]);

  if (sleepData.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50">
        <Moon className="mb-2 size-8 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">No sleep data</p>
        <p className="text-muted-foreground text-xs">Sync to fetch data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{weekRangeLabel}</span>
        <div className="flex items-center gap-1">
          <Button
            className="h-6 w-6"
            disabled={!canGoBack || isLoading}
            onClick={handlePrevWeek}
            size="icon"
            variant="ghost"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            className="h-6 w-6"
            disabled={!canGoForward || isLoading}
            onClick={handleNextWeek}
            size="icon"
            variant="ghost"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <ChartContainer
        className="max-h-[200px] min-h-[180px]"
        config={chartConfig}
      >
        <BarChart
          accessibilityLayer
          data={currentWeekData}
          margin={{ left: -20, right: 12, top: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="dayLabel"
            fontSize={11}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            axisLine={false}
            domain={[0, 10]}
            fontSize={11}
            tickFormatter={(value: number) => `${value}h`}
            tickLine={false}
            tickMargin={4}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                // formatter={(value) => (
                //   <span className="font-medium font-mono tabular-nums">
                //     {formatHours(value as number)}
                //   </span>
                // )}
                // labelFormatter={(_, payload) => {
                //   const data = payload?.[0]?.payload;
                //   if (!data?.date) {
                //     return null;
                //   }

                //   const formattedDate = new Date(data.date).toLocaleDateString(
                //     "en-US",
                //     {
                //       weekday: "long",
                //       month: "short",
                //       day: "numeric",
                //     }
                //   );

                //   return (
                //     <>
                //       <div>{formattedDate}</div>
                //       {data.sleepScore !== null && (
                //         <div className="mt-1 flex items-center justify-between border-b pb-1.5">
                //           <span className="text-muted-foreground text-xs">
                //             Sleep Score
                //           </span>
                //           <span
                //             className={cn(
                //               "font-semibold",
                //               qualityColors[data.quality]
                //             )}
                //           >
                //             {data.sleepScore} ({data.quality})
                //           </span>
                //         </div>
                //       )}
                //       <div className="mt-1 flex items-center justify-between">
                //         <span className="text-muted-foreground text-xs">
                //           Total
                //         </span>
                //         <span className="font-medium">
                //           {formatHours(data.totalHours)}
                //         </span>
                //       </div>
                //     </>
                //   );
                // }}
              />
            }
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
          />
          <Bar
            dataKey="deepHours"
            fill="var(--color-deepHours)"
            radius={[0, 0, 0, 0]}
            stackId="sleep"
          />
          <Bar
            dataKey="lightHours"
            fill="var(--color-lightHours)"
            radius={[0, 0, 0, 0]}
            stackId="sleep"
          />
          <Bar
            dataKey="remHours"
            fill="var(--color-remHours)"
            radius={[0, 0, 0, 0]}
            stackId="sleep"
          />
          <Bar
            dataKey="awakeHours"
            fill="var(--color-awakeHours)"
            radius={[0, 0, 0, 0]}
            stackId="sleep"
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
};
