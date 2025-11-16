"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { cn } from "@repo/design-system/lib/utils";
import { log } from "@repo/observability/log";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type AthleteData = {
  firstname: string | null;
  lastname: string | null;
  profile: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  summit: boolean | null;
};

type StravaConnectionProps = {
  isConnected: boolean;
  athleteId?: string;
  athleteData?: AthleteData;
};

const StravaShieldAvatar = ({ src }: { src: string }) => (
  <div className="relative h-[52px] w-[52px]">
    <svg
      className="absolute inset-0 h-full w-full"
      fill="none"
      role="img"
      viewBox="0 0 64 64"
    >
      <title>Strava Summit Member</title>
      <defs>
        <clipPath id="shield-clip">
          <path
            d="M51.428 1.75a3.323 3.323 0 0 1 3.322 3.322V46.08c0 1.222-.67 2.337-1.73 2.916l-.218.11-22.356 10.157a5.914 5.914 0 0 1-4.598.124l-.294-.124L3.198 49.105a3.323 3.323 0 0 1-1.948-3.026V5.072A3.323 3.323 0 0 1 4.572 1.75h46.856Z"
            transform="translate(4, 1.229)"
          />
        </clipPath>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="gradient"
          x1="-23.823"
          x2="36.668"
          y1="-14.783"
          y2="76.122"
        >
          <stop stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#fc5200" />
          <stop offset="1" stopColor="#4d0000" />
        </linearGradient>
      </defs>
      <foreignObject
        clipPath="url(#shield-clip)"
        height="64"
        width="64"
        x="0"
        y="0"
      >
        <div className="h-full w-full">
          <Image
            alt="Athlete profile"
            className="h-full w-full object-cover"
            fill
            src={src}
          />
        </div>
      </foreignObject>
      <path
        d="M51.428 1.75a3.323 3.323 0 0 1 3.322 3.322V46.08c0 1.222-.67 2.337-1.73 2.916l-.218.11-22.356 10.157a5.914 5.914 0 0 1-4.598.124l-.294-.124L3.198 49.105a3.323 3.323 0 0 1-1.948-3.026V5.072A3.323 3.323 0 0 1 4.572 1.75h46.856Z"
        fill="none"
        stroke="url(#gradient)"
        strokeWidth="2.5"
        transform="translate(4, 1.229)"
      />
    </svg>
  </div>
);

const AthleteInfo = ({ athleteData }: { athleteData: AthleteData }) => {
  const hasProfileData =
    athleteData.firstname || athleteData.lastname || athleteData.profile;

  if (!hasProfileData) {
    return null;
  }

  const fullName = [athleteData.firstname, athleteData.lastname]
    .filter(Boolean)
    .join(" ");

  const location = [athleteData.city, athleteData.state, athleteData.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex items-center gap-4">
      {athleteData.profile &&
        (athleteData.summit ? (
          <StravaShieldAvatar src={athleteData.profile} />
        ) : (
          <Image
            alt="Athlete profile"
            className="rounded-lg"
            height={52}
            src={athleteData.profile}
            width={52}
          />
        ))}

      <div className="flex flex-col items-start">
        {fullName && <div className="font-semibold text-base">{fullName}</div>}
        {location && <div className="text-sm">{location}</div>}
      </div>
    </div>
  );
};

export const StravaConnection = ({
  isConnected: initialConnected,
  athleteData,
}: StravaConnectionProps) => {
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
      log.error(`Failed to disconnect: ${error}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card className="w-full min-w-[270px] shadow-none">
      <CardHeader>
        <CardTitle className="flex flex-row justify-between">
          <div className="flex items-center gap-2">
            <Image
              alt="Strava"
              className="rounded-sm"
              height={24}
              src="/strava-logo.png"
              width={24}
            />
            Strava
          </div>
          <Badge
            className={cn(
              "gap-1.5",
              isConnected
                ? "bg-success-container text-success"
                : "bg-primary/10 text-primary"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isConnected ? "bg-success" : "bg-primary"
              )}
            />
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </CardTitle>
        {!isConnected && (
          <CardDescription>
            Connect your Strava account to export workout data
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            {athleteData && <AthleteInfo athleteData={athleteData} />}
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
          </div>
        ) : (
          <Button className="w-full" onClick={handleConnect}>
            Connect to Strava
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
