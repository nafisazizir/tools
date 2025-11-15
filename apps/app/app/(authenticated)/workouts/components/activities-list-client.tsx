"use client";

import type { StravaActivity } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
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
import { Label } from "@repo/design-system/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { cn } from "@repo/design-system/lib/utils";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { getSportTypeIcon, getSportTypeLabel } from "@/lib/strava-sport-types";
import {
  formatDateTime,
  formatDuration,
  formatPace,
  METERS_PER_KM,
} from "./activity-utils";

type ActivitiesListClientProps = {
  activities: StravaActivity[];
};

export const ActivitiesListClient = ({
  activities,
}: ActivitiesListClientProps) => {
  const [selectedSportTypes, setSelectedSportTypes] = useState<Set<string>>(
    new Set()
  );

  const availableSportTypes = useMemo(() => {
    const types = new Set(activities.map((a) => a.sport_type));
    return Array.from(types).sort();
  }, [activities]);

  const filteredActivities = useMemo(() => {
    if (selectedSportTypes.size === 0) {
      return activities;
    }
    return activities.filter((activity) =>
      selectedSportTypes.has(activity.sport_type)
    );
  }, [activities, selectedSportTypes]);

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

  if (activities.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image
              alt="Activities"
              className="h-5 w-5"
              height={20}
              src="/icons/dumbbell-regular-full.svg"
              width={20}
            />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Your latest workouts will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No activities synced yet. Click "Sync Activities" to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
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
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {filteredActivities.map((activity) => {
          const date = new Date(activity.start_date);
          const distance = activity.distance
            ? (activity.distance / METERS_PER_KM).toFixed(2)
            : null;
          const duration = activity.moving_time
            ? formatDuration(activity.moving_time)
            : null;
          const pace =
            activity.moving_time && activity.distance
              ? formatPace(
                  activity.moving_time / (activity.distance / METERS_PER_KM)
                )
              : null;

          const iconSrc = activity.sport_type
            ? getSportTypeIcon(activity.sport_type)
            : "/icons/dumbbell-regular-full.svg";

          return (
            <Card className="shadow-none" key={activity.id}>
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
                      {formatDateTime(date, activity.timezone.split(" ")[1])}
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
                <div className="flex flex-wrap gap-4">
                  {distance && (
                    <div className="flex flex-col items-start">
                      <span className="text-muted-foreground text-xs">
                        Distance
                      </span>
                      <span className="font-medium text-xl">{distance} km</span>
                    </div>
                  )}

                  {pace && (
                    <div className="flex flex-col items-start">
                      <span className="text-muted-foreground text-xs">
                        Pace
                      </span>
                      <span className="font-medium text-xl">{pace}</span>
                    </div>
                  )}

                  {duration && (
                    <div className="flex flex-col items-start">
                      <span className="text-muted-foreground text-xs">
                        Time
                      </span>
                      <span className="font-medium text-xl">{duration}</span>
                    </div>
                  )}

                  {activity.has_heartrate && activity.average_heartrate && (
                    <div className="flex flex-col items-start">
                      <span className="text-muted-foreground text-xs">
                        Avg HR
                      </span>
                      <span className="font-medium text-xl">
                        {activity.average_heartrate.toFixed(0)} bpm
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
