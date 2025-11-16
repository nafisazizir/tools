"use client";

import type { StravaActivity } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
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
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { cn } from "@repo/design-system/lib/utils";
import { log } from "@repo/observability/log";
import {
  Braces,
  ChevronDown,
  FolderX,
  LayoutGrid,
  Loader2Icon,
  RefreshCwIcon,
  Table,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { env } from "@/env";
import { getSportTypeLabel } from "@/lib/strava-sport-types";
import { ActivityCard } from "./activity-card";

type ActivitiesListClientProps = {
  activities: StravaActivity[];
  athleteId: string;
};

const START_OF_DAY = { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 };
const END_OF_DAY = { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 };
const DELAY_DURATION = 1500;

export const ActivitiesListClient = ({
  activities,
  athleteId,
}: ActivitiesListClientProps) => {
  const [selectedSportTypes, setSelectedSportTypes] = useState<Set<string>>(
    new Set()
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isSyncing, setIsSyncing] = useState(false);

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

  const toggleSportType = (sportType: string) => {
    const newSet = new Set(selectedSportTypes);
    if (newSet.has(sportType)) {
      newSet.delete(sportType);
    } else {
      newSet.add(sportType);
    }
    setSelectedSportTypes(newSet);
  };

  const clearFilters = () => {
    setSelectedSportTypes(new Set());
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

  const handleSync = async () => {
    if (!athleteId) {
      toast.error("Error", {
        description: "Please connect your Strava account first",
      });
      return;
    }

    setIsSyncing(true);

    try {
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/strava/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          athleteId,
        }),
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      const data = await response.json();

      const parts: string[] = [];
      if (data.created > 0) {
        parts.push(`${data.created} new`);
      }
      if (data.updated > 0) {
        parts.push(`${data.updated} updated`);
      }
      if (data.deleted > 0) {
        parts.push(`${data.deleted} deleted`);
      }

      toast.success("Sync complete", {
        description: parts.length > 0 ? parts.join(", ") : "No changes",
      });

      setTimeout(() => {
        window.location.reload();
      }, DELAY_DURATION);
    } catch (error) {
      log.error(`Failed to sync activities: ${error}`);
      toast.error("Sync failed", {
        description: "Failed to sync activities. Please try again.",
      });
    } finally {
      setIsSyncing(false);
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
            No activities synced yet. Your latest workouts will appear here
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Tabs defaultValue="grid">
      <div className="flex w-full flex-wrap-reverse justify-between gap-y-2 space-x-4">
        <TabsList>
          <TabsTrigger value="grid">
            <LayoutGrid className="h-4 w-4" />
            Grid
          </TabsTrigger>
          <TabsTrigger disabled value="table">
            <Table className="h-4 w-4" />
            Table
          </TabsTrigger>
          <TabsTrigger disabled value="json">
            <Braces className="h-4 w-4" />
            JSON
          </TabsTrigger>
        </TabsList>

        <div className="flex gap-2">
          <Button disabled={isSyncing} onClick={handleSync}>
            {isSyncing ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCwIcon className="h-4 w-4" />
                Sync Activities
              </>
            )}
          </Button>

          <Button
            className="h-9 w-9 border-none bg-[#D77655] p-0 shadow-none outline-none hover:bg-[#c95c38]"
            onClick={copyActivitiesToClipboard}
            variant={"outline"}
          >
            <Image alt="Claude" height={28} src="/claude-logo.png" width={28} />
          </Button>
        </div>
      </div>

      <Separator className="my-1" />

      <TabsContent className="space-y-4" value="grid">
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={cn(
                  "rounded-full",
                  selectedSportTypes.size > 0
                    ? "bg-accent"
                    : "font-normal text-muted-foreground hover:text-muted-foreground"
                )}
                size={"sm"}
                variant="ghost"
              >
                Sport Type
                {selectedSportTypes.size > 0 && (
                  <>
                    :
                    <span className="inline-block max-w-[100px] truncate font-normal">
                      {Array.from(selectedSportTypes).join(", ")}
                    </span>
                  </>
                )}
                <ChevronDown />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search sport types..." />
                <CommandList>
                  <CommandEmpty>No sport types found.</CommandEmpty>
                  <CommandGroup>
                    {availableSportTypes.map((sportType) => {
                      const isSelected = selectedSportTypes.has(sportType);
                      return (
                        <CommandItem
                          key={sportType}
                          onSelect={() => toggleSportType(sportType)}
                        >
                          <div className="flex w-full items-center space-x-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSportType(sportType)}
                            />
                            <Label>{getSportTypeLabel(sportType)}</Label>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  {selectedSportTypes.size > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem className="py-1" onSelect={clearFilters}>
                          Clear filters
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
                className={cn(
                  "rounded-full",
                  dateRange?.from
                    ? "bg-accent"
                    : "font-normal text-muted-foreground hover:text-muted-foreground"
                )}
                size={"sm"}
                variant="ghost"
              >
                Date
                {dateRange?.from && (
                  <>
                    :
                    <span className="inline-block max-w-[150px] truncate font-normal">
                      {formatDateRangeDisplay(dateRange)}
                    </span>
                  </>
                )}
                <ChevronDown />
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
        </div>

        {/* Activities List */}
        <div className="space-y-3">
          {filteredActivities.map((activity) => (
            <ActivityCard activity={activity} key={activity.id} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="table">
        <div className="text-center text-muted-foreground">
          Table view coming soon
        </div>
      </TabsContent>

      <TabsContent value="json">
        <div className="text-center text-muted-foreground">
          JSON view coming soon
        </div>
      </TabsContent>
    </Tabs>
  );
};
