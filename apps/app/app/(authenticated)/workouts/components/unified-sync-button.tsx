"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { log } from "@repo/observability/log";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSyncActivitiesMutation } from "@/hooks/use-activities-query";
import { useSyncSleepMutation } from "@/hooks/use-sleep-query";

type UnifiedSyncButtonProps = {
  athleteId?: string;
  garminConnected: boolean;
};

export const UnifiedSyncButton = ({
  athleteId,
  garminConnected,
}: UnifiedSyncButtonProps) => {
  const syncActivitiesMutation = useSyncActivitiesMutation();
  const syncSleepMutation = useSyncSleepMutation();

  const isAnySyncing =
    syncActivitiesMutation.isPending || syncSleepMutation.isPending;

  const handleSync = async () => {
    const promises: Promise<unknown>[] = [];
    const sources: string[] = [];

    // Trigger activities sync if Strava connected
    if (athleteId) {
      sources.push("activities");
      promises.push(
        syncActivitiesMutation.mutateAsync({ athleteId }).catch((error) => {
          log.error(`Failed to sync activities: ${error}`);
          return { error: "activities" };
        })
      );
    }

    // Trigger sleep sync if Garmin connected
    if (garminConnected) {
      sources.push("sleep");
      promises.push(
        syncSleepMutation.mutateAsync({ days: 14 }).catch((error) => {
          log.error(`Failed to sync sleep: ${error}`);
          return { error: "sleep" };
        })
      );
    }

    if (promises.length === 0) {
      toast.info("No sources connected", {
        description: "Connect Strava or Garmin to sync data",
      });
      return;
    }

    const results = await Promise.allSettled(promises);
    const successful = results.filter(
      (r) => r.status === "fulfilled" && !("error" in (r.value as object))
    ).length;
    const failed = results.length - successful;

    if (failed === 0) {
      toast.success("Sync complete", {
        description: `Synced ${sources.join(" and ")}`,
      });
    } else if (successful > 0) {
      toast.warning("Partial sync", {
        description: "Some sources failed to sync",
      });
    } else {
      toast.error("Sync failed", {
        description: "Failed to sync all sources",
      });
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          disabled={isAnySyncing}
          onClick={handleSync}
          size="sm"
          variant="outline"
        >
          {isAnySyncing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          <span className="ml-2 hidden sm:inline">Sync</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Sync all connected sources</TooltipContent>
    </Tooltip>
  );
};
