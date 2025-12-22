"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import { log } from "@repo/observability/log";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Moon, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

type SleepDataSummary = {
  date: string;
  sleepScore: number | null;
  totalHours: number;
  deepHours: number;
  lightHours: number;
  remHours: number;
  awakeHours: number;
  sleepStart: string;
  sleepEnd: string;
  quality: "excellent" | "good" | "fair" | "poor";
};

type GarminSleepDisplayProps = {
  connected: boolean;
  sleepData: SleepDataSummary[];
  lastSync?: string;
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

const SleepCard = ({ sleep }: { sleep: SleepDataSummary }) => {
  const date = new Date(sleep.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium text-sm">{formattedDate}</span>
        {sleep.sleepScore !== null && (
          <span
            className={cn(
              "font-semibold text-lg",
              qualityColors[sleep.quality]
            )}
          >
            {sleep.sleepScore}
          </span>
        )}
      </div>

      <div className="mb-2 flex items-center gap-2 text-muted-foreground text-sm">
        <Moon className="size-4" />
        <span>{formatHours(sleep.totalHours)} total</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Deep</span>
          <span>{formatHours(sleep.deepHours)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Light</span>
          <span>{formatHours(sleep.lightHours)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">REM</span>
          <span>{formatHours(sleep.remHours)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Awake</span>
          <span>{formatHours(sleep.awakeHours)}</span>
        </div>
      </div>
    </div>
  );
};

export const GarminSleepDisplay = ({
  connected,
  sleepData,
  lastSync,
}: GarminSleepDisplayProps) => {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await apiClient.syncGarminSleep({ days: 14 });
      router.refresh();
    } catch (error) {
      log.error(`Failed to sync Garmin sleep: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!connected) {
    return null;
  }

  const lastSyncText = lastSync
    ? `Last synced ${formatDistanceToNow(new Date(lastSync), { addSuffix: true })}`
    : "Not synced yet";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-muted-foreground text-sm">
            Sleep Data
          </h3>
          <p className="text-muted-foreground text-xs">{lastSyncText}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Sync
        </Button>
      </div>

      {sleepData.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
          <Moon className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No sleep data yet</p>
          <p className="text-muted-foreground text-xs">
            Click sync to fetch your sleep data from Garmin
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sleepData.map((sleep) => (
            <SleepCard key={sleep.date} sleep={sleep} />
          ))}
        </div>
      )}
    </div>
  );
};
