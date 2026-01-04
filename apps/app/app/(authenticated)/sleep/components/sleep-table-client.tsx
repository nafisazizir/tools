"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/design-system/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import { log } from "@repo/observability/log";
import { CalendarDays, ChevronDown, Copy, Moon, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { useSleepRangeQuery } from "@/hooks/use-sleep-query";

const ITEMS_PER_PAGE = 15;
const MAX_VISIBLE_PAGES = 5;
const PAGINATION_EDGE_THRESHOLD = 3;
const PAGINATION_OFFSET = 2;
const START_OF_DAY = { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
const END_OF_DAY = { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 };

type Quality = "excellent" | "good" | "fair" | "poor";

const getQualityBadgeStyles = (quality: Quality) => {
  switch (quality) {
    case "excellent":
      return "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "good":
      return "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400";
    case "fair":
      return "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "poor":
      return "border-transparent bg-red-500/15 text-red-700 dark:text-red-400";
    default:
      return "";
  }
};

const capitalizeQuality = (quality: Quality) =>
  quality.charAt(0).toUpperCase() + quality.slice(1);

const formatDuration = (hours: number) => {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const SleepTableClient = () => {
  const { data, isLoading } = useSleepRangeQuery();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const sleepData = data?.data ?? [];

  const filteredData = useMemo(() => {
    if (!dateRange?.from) {
      return sleepData;
    }

    return sleepData.filter((record) => {
      const recordDate = new Date(record.date);
      if (!dateRange.from) {
        return false;
      }
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(
        START_OF_DAY.hours,
        START_OF_DAY.minutes,
        START_OF_DAY.seconds,
        START_OF_DAY.milliseconds
      );

      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(
          END_OF_DAY.hours,
          END_OF_DAY.minutes,
          END_OF_DAY.seconds,
          END_OF_DAY.milliseconds
        );
        return recordDate >= fromDate && recordDate <= toDate;
      }

      return recordDate >= fromDate;
    });
  }, [sleepData, dateRange]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // Reset to page 1 when filters change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setDateRange(undefined);
    setCurrentPage(1);
  };

  const formatDateRangeDisplay = (range: DateRange | undefined): string => {
    if (!range?.from) {
      return "";
    }

    const formatShort = (date: Date) =>
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

    if (!range.to) {
      return formatShort(range.from);
    }

    return `${formatShort(range.from)} - ${formatShort(range.to)}`;
  };

  const copySleepDataToClipboard = async () => {
    const exportData = filteredData.map((record) => ({
      date: record.date,
      sleepScore: record.sleepScore,
      totalHours: Number(record.totalHours.toFixed(2)),
      deepHours: Number(record.deepHours.toFixed(2)),
      lightHours: Number(record.lightHours.toFixed(2)),
      remHours: Number(record.remHours.toFixed(2)),
      awakeHours: Number(record.awakeHours.toFixed(2)),
      quality: record.quality,
    }));

    const jsonString = JSON.stringify(exportData, null, 2);

    try {
      await navigator.clipboard.writeText(jsonString);
      toast.success("Copied to clipboard", {
        description: `${filteredData.length} sleep records copied successfully`,
      });
    } catch (error) {
      toast.error("Failed to copy", {
        description: "Could not copy to clipboard",
      });
      log.error(`Failed to copy: ${error}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground text-sm">
          Loading sleep data...
        </div>
      </div>
    );
  }

  if (sleepData.length === 0) {
    return (
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Moon />
          </EmptyMedia>
          <EmptyTitle>No Sleep Data</EmptyTitle>
          <EmptyDescription>
            Sync your Garmin data from the Workouts page to view sleep records
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={cn("h-8", dateRange?.from && "bg-accent")}
                size="sm"
                variant="outline"
              >
                <CalendarDays className="size-3.5" />
                <span>
                  {dateRange?.from
                    ? formatDateRangeDisplay(dateRange)
                    : "Date Range"}
                </span>
                <ChevronDown className="size-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                defaultMonth={
                  dateRange?.from ||
                  (sleepData.length > 0
                    ? new Date(sleepData[0].date)
                    : new Date())
                }
                mode="range"
                numberOfMonths={1}
                onSelect={handleDateRangeChange}
                selected={dateRange}
              />
            </PopoverContent>
          </Popover>

          {dateRange?.from && (
            <Button
              className="h-8 text-muted-foreground"
              onClick={clearFilters}
              size="sm"
              variant="ghost"
            >
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {filteredData.length} of {sleepData.length}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-8"
                onClick={copySleepDataToClipboard}
                size="icon"
                variant="ghost"
              >
                <Copy className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy as JSON</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Bedtime</TableHead>
              <TableHead>Wake Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Quality</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((record) => (
              <TableRow key={record.date}>
                <TableCell className="font-medium">
                  {formatDate(record.date)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatTime(record.sleepStart)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatTime(record.sleepEnd)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatDuration(record.totalHours)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {record.sleepScore ?? "-"}
                </TableCell>
                <TableCell>
                  <Badge className={getQualityBadgeStyles(record.quality)}>
                    {capitalizeQuality(record.quality)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className={cn(
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
              />
            </PaginationItem>

            {Array.from(
              { length: Math.min(MAX_VISIBLE_PAGES, totalPages) },
              (_, i) => {
                let pageNum: number;
                if (totalPages <= MAX_VISIBLE_PAGES) {
                  pageNum = i + 1;
                } else if (currentPage <= PAGINATION_EDGE_THRESHOLD) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - PAGINATION_OFFSET) {
                  pageNum = totalPages - MAX_VISIBLE_PAGES + 1 + i;
                } else {
                  pageNum = currentPage - PAGINATION_OFFSET + i;
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === pageNum}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNum);
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
            )}

            <PaginationItem>
              <PaginationNext
                className={cn(
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};
