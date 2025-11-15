"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { log } from "@repo/observability/log";
import { DownloadIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { env } from "@/env";

type ActivitiesSyncProps = {
  athleteId: string;
  isConnected: boolean;
};

const DELAY_DURATION = 1500;

const SYNC_STATUS_STYLES_MAP: Record<string, string> = {
  success:
    "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300",
  error: "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300",
  info: "bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
};

export const ActivitiesSync = ({
  athleteId,
  isConnected,
}: ActivitiesSyncProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const handleSync = async () => {
    if (!athleteId) {
      setSyncStatus({
        message: "Please connect your Strava account first",
        type: "error",
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ message: "Syncing activities...", type: "info" });

    try {
      // Call the sync endpoint in apps/api
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/strava/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          athleteId,
          daysBack: 30,
        }),
      });

      if (!response.ok) {
        throw new Error("Sync failed");
      }

      const data = await response.json();

      setSyncStatus({
        message: `Synced ${data.synced} new activities, updated ${data.updated} activities`,
        type: "success",
      });

      setTimeout(() => {
        window.location.reload();
      }, DELAY_DURATION);
    } catch (error) {
      log.error(`Failed to sync activities: ${error}`);
      setSyncStatus({
        message: "Failed to sync activities. Please try again.",
        type: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    if (!athleteId) {
      return;
    }

    const url = `/api/strava/activities/export?athleteId=${athleteId}&limit=30&format=json`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!isConnected || isSyncing}
          onClick={handleSync}
        >
          {isSyncing ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCwIcon className="mr-2 h-4 w-4" />
              Sync Activities
            </>
          )}
        </Button>

        <Button
          disabled={!isConnected || isSyncing}
          onClick={handleExport}
          variant="outline"
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {syncStatus && (
        <div
          className={cn(
            "rounded-md p-3 text-sm",
            SYNC_STATUS_STYLES_MAP[syncStatus.type]
          )}
        >
          {syncStatus.message}
        </div>
      )}

      {!isConnected && (
        <p className="text-muted-foreground text-sm">
          Connect your Strava account to sync activities
        </p>
      )}
    </div>
  );
};
