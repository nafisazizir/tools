"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { log } from "@repo/observability/log";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type GarminConnectionProps = {
  isConnected: boolean;
  athleteId?: string;
};

export const GarminConnection = ({
  isConnected: initialConnected,
}: GarminConnectionProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(initialConnected);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const connected = searchParams.get("connected");
    if (connected === "true") {
      setIsConnected(true);
      router.replace("/workouts");
    }
  }, [searchParams, router]);

  const handleConnect = () => {
    window.location.href = "/api/strava/connect";
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch("/api/strava/disconnect", {
        method: "POST",
      });
      if (response.ok) {
        setIsConnected(false);
        router.refresh();
      }
    } catch (error) {
      log.error(`Failed to disconnect ${error}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {/* <ActivityIcon className="h-5 w-5" /> */}
          <Image
            alt="Garmin"
            className="rounded-sm"
            height={24}
            src="/garmin-logo.png"
            width={24}
          />
          Garmin
        </CardTitle>
        <CardDescription>
          Connect your Garmin account to export workout data
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <Button
            className="w-full"
            disabled={isDisconnecting}
            onClick={handleDisconnect}
            variant="outline"
          >
            {isDisconnecting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              "Disconnect"
            )}
          </Button>
        ) : (
          <Button className="w-full" onClick={handleConnect}>
            Connect to Garmin
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
