"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/design-system/components/ui/command";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import { log } from "@repo/observability/log";
import { CalendarDays, ChevronDown, Filter, FolderX, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { useActivitiesQuery } from "@/hooks/use-activities-query";
import { getSportTypeLabel } from "@/lib/strava-sport-types";
import { ActivityCard } from "./activity-card";

type ActivitiesListClientProps = {
  athleteId: string;
};

const START_OF_DAY = { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
const END_OF_DAY = { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 };

export const ActivitiesListClient = ({
  athleteId,
}: ActivitiesListClientProps) => {
  const { data } = useActivitiesQuery(athleteId);

  const [selectedSportTypes, setSelectedSportTypes] = useState<Set<string>>(
    new Set()
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const activities = data?.activities ?? [];

  const availableSportTypes = useMemo(() => {
    const types = new Set(activities.map((a) => a.sport_type));
    return Array.from(types).sort();
  }, [activities]);

  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (selectedSportTypes.size > 0) {
      filtered = filtered.filter((activity) =>
        selectedSportTypes.has(activity.sport_type)
      );
    }

    if (dateRange?.from) {
      filtered = filtered.filter((activity) => {
        const activityDate = new Date(activity.start_date);
        const fromDate = dateRange.from ? dateRange.from : new Date();
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
          return activityDate >= fromDate && activityDate <= toDate;
        }

        return activityDate >= fromDate;
      });
    }

    return filtered;
  }, [activities, selectedSportTypes, dateRange]);

  const hasActiveFilters = selectedSportTypes.size > 0 || dateRange?.from;

  const toggleSportType = (sportType: string) => {
    const newSet = new Set(selectedSportTypes);
    if (newSet.has(sportType)) {
      newSet.delete(sportType);
    } else {
      newSet.add(sportType);
    }
    setSelectedSportTypes(newSet);
  };

  const clearAllFilters = () => {
    setSelectedSportTypes(new Set());
    setDateRange(undefined);
  };

  const formatDateRangeDisplay = (range: DateRange | undefined): string => {
    if (!range?.from) {
      return "";
    }

    const formatDate = (date: Date) =>
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

    if (!range.to) {
      return formatDate(range.from);
    }

    return `${formatDate(range.from)} - ${formatDate(range.to)}`;
  };

  const copyActivitiesToClipboard = async () => {
    const transformedActivities = filteredActivities.map((activity) => ({
      name: activity.name,
      description: activity.description,
      sport_type: activity.sport_type,
      start_date_local: activity.start_date_local,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      average_heartrate: activity.average_heartrate,
      max_heartrate: activity.max_heartrate,
      total_elevation_gain: activity.total_elevation_gain,
      device_name: activity.device_name,
      split_metrics: activity.splits_metric,
      laps: activity.laps,
      zones: activity.zones,
    }));

    const jsonString = JSON.stringify(transformedActivities, null, 2);

    try {
      await navigator.clipboard.writeText(jsonString);
      toast.success("Copied to clipboard", {
        description: `${filteredActivities.length} activities copied successfully`,
      });
    } catch (error) {
      toast.error("Failed to copy", {
        description: "Could not copy to clipboard",
      });
      log.error(`Failed to copy: ${error}`);
    }
  };

  if (activities.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderX />
          </EmptyMedia>
          <EmptyTitle>No Activities Yet</EmptyTitle>
          <EmptyDescription>
            Use the sync button above to fetch your activities
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
                className={cn(
                  "h-8",
                  selectedSportTypes.size > 0 && "bg-accent"
                )}
                size="sm"
                variant="outline"
              >
                <Filter className="size-3.5" />
                <span>Activity</span>
                {selectedSportTypes.size > 0 && (
                  <Badge
                    className="ml-1 size-5 rounded-full p-0"
                    variant="secondary"
                  >
                    {selectedSportTypes.size}
                  </Badge>
                )}
                <ChevronDown className="size-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[200px] p-0">
              <Command>
                <CommandList>
                  <CommandEmpty>No types found.</CommandEmpty>
                  <CommandGroup>
                    {availableSportTypes.map((sportType) => {
                      const isSelected = selectedSportTypes.has(sportType);
                      return (
                        <CommandItem
                          key={sportType}
                          onSelect={() => toggleSportType(sportType)}
                        >
                          <div className="flex w-full items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSportType(sportType)}
                            />
                            <Label className="flex-1 cursor-pointer">
                              {getSportTypeLabel(sportType)}
                            </Label>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  {selectedSportTypes.size > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          className="justify-center text-muted-foreground text-xs"
                          onSelect={() => setSelectedSportTypes(new Set())}
                        >
                          Clear selection
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={cn("h-8", dateRange?.from && "bg-accent")}
                size="sm"
                variant="outline"
              >
                <CalendarDays className="size-3.5" />
                <span>
                  {dateRange?.from ? formatDateRangeDisplay(dateRange) : "Date"}
                </span>
                <ChevronDown className="size-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                defaultMonth={
                  dateRange?.from ||
                  (activities.length > 0
                    ? new Date(activities[0].start_date)
                    : new Date())
                }
                mode="range"
                numberOfMonths={1}
                onSelect={setDateRange}
                selected={dateRange}
              />
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button
              className="h-8 text-muted-foreground"
              onClick={clearAllFilters}
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
            {filteredActivities.length} of {activities.length}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-8"
                onClick={copyActivitiesToClipboard}
                size="icon"
                variant="ghost"
              >
                <Image
                  alt="Claude"
                  height={18}
                  src="/claude-logo.png"
                  width={18}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy as JSON for Claude</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredActivities.map((activity) => (
          <ActivityCard activity={activity} key={activity.id} />
        ))}
      </div>
    </div>
  );
};
