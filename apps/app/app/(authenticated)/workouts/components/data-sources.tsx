"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/design-system/components/ui/tooltip";
import { cn } from "@repo/design-system/lib/utils";
import { log } from "@repo/observability/log";
import { Check, Loader2, LogOut, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const noop = () => {
  // Intentionally empty - placeholder for disabled sources
};

type AthleteData = {
  firstname: string | null;
  lastname: string | null;
  profile: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  summit: boolean | null;
};

type DataSourcesProps = {
  stravaConnected: boolean;
  stravaAthleteData?: AthleteData;
};

type SourceItemProps = {
  name: string;
  logo: string;
  isConnected: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onConnect: () => void;
  onDisconnect: () => void;
  athleteName?: string;
};

const SourceItemStatus = ({
  isConnected,
  disabled,
  disabledReason,
  athleteName,
}: Pick<
  SourceItemProps,
  "isConnected" | "disabled" | "disabledReason" | "athleteName"
>) => {
  if (isConnected && athleteName) {
    return (
      <span className="truncate text-muted-foreground text-xs">
        {athleteName}
      </span>
    );
  }
  if (disabled && disabledReason) {
    return (
      <span className="text-muted-foreground text-xs">{disabledReason}</span>
    );
  }
  if (!(isConnected || disabled)) {
    return <span className="text-muted-foreground text-xs">Not connected</span>;
  }
  return null;
};

const getButtonIcon = (
  isLoading: boolean | undefined,
  isConnected: boolean
) => {
  if (isLoading) {
    return <Loader2 className="size-4 animate-spin" />;
  }
  if (isConnected) {
    return <LogOut className="size-4" />;
  }
  return <Plus className="size-4" />;
};

const SourceItemButton = ({
  isConnected,
  isLoading,
  onConnect,
  onDisconnect,
}: Pick<
  SourceItemProps,
  "isConnected" | "isLoading" | "onConnect" | "onDisconnect"
>) => (
  <Button
    className="shrink-0"
    disabled={isLoading}
    onClick={isConnected ? onDisconnect : onConnect}
    size="sm"
    variant={isConnected ? "ghost" : "outline"}
  >
    {getButtonIcon(isLoading, isConnected)}
    <span className="sr-only sm:not-sr-only">
      {isConnected ? "Disconnect" : "Connect"}
    </span>
  </Button>
);

const SourceItem = ({
  name,
  logo,
  isConnected,
  isLoading,
  disabled,
  disabledReason,
  onConnect,
  onDisconnect,
  athleteName,
}: SourceItemProps) => {
  const content = (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border bg-card p-3 transition-all",
        isConnected && "border-success/20 bg-success/5",
        disabled && "opacity-60"
      )}
    >
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Image
          alt={name}
          className="rounded-md"
          height={24}
          src={logo}
          width={24}
        />
        {isConnected && (
          <div className="-bottom-1 -right-1 absolute flex size-4 items-center justify-center rounded-full bg-success">
            <Check className="size-2.5 text-white" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{name}</span>
          {disabled && (
            <Badge
              className="bg-muted text-[10px] text-muted-foreground"
              variant="secondary"
            >
              Coming Soon
            </Badge>
          )}
        </div>
        <SourceItemStatus
          athleteName={athleteName}
          disabled={disabled}
          disabledReason={disabledReason}
          isConnected={isConnected}
        />
      </div>

      {!disabled && (
        <SourceItemButton
          isConnected={isConnected}
          isLoading={isLoading}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      )}
    </div>
  );

  if (disabled && disabledReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

export const DataSources = ({
  stravaConnected: initialConnected,
  stravaAthleteData,
}: DataSourcesProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stravaConnected, setStravaConnected] = useState(initialConnected);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const connected = searchParams.get("connected");
    if (connected === "true") {
      setStravaConnected(true);
      router.replace("/workouts");
    }
  }, [searchParams, router]);

  const handleStravaConnect = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
    const redirectUrl = encodeURIComponent(window.location.pathname);
    window.location.href = `${apiUrl}/strava/connect?redirectUrl=${redirectUrl}`;
  };

  const handleStravaDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
      const response = await fetch(`${apiUrl}/strava/disconnect`, {
        method: "POST",
      });
      if (response.ok) {
        setStravaConnected(false);
        router.refresh();
      }
    } catch (error) {
      log.error(`Failed to disconnect: ${error}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const stravaAthleteName =
    stravaAthleteData?.firstname && stravaAthleteData?.lastname
      ? `${stravaAthleteData.firstname} ${stravaAthleteData.lastname}`
      : undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-muted-foreground text-sm">
          Data Sources
        </h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <SourceItem
          athleteName={stravaAthleteName}
          isConnected={stravaConnected}
          isLoading={isDisconnecting}
          logo="/strava-logo.png"
          name="Strava"
          onConnect={handleStravaConnect}
          onDisconnect={handleStravaDisconnect}
        />
        <SourceItem
          disabled
          disabledReason="Garmin Connect API not available"
          isConnected={false}
          logo="/garmin-logo.png"
          name="Garmin"
          onConnect={noop}
          onDisconnect={noop}
        />
        <SourceItem
          disabled
          disabledReason="Requires Hevy Pro subscription"
          isConnected={false}
          logo="/hevy-logo.png"
          name="Hevy"
          onConnect={noop}
          onDisconnect={noop}
        />
      </div>
    </div>
  );
};
