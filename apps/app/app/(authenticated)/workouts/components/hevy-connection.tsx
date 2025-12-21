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
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type HevyConnectionProps = {
  isConnected: boolean;
  athleteId?: string;
};

export const HevyConnection = ({
  isConnected: initialConnected,
}: HevyConnectionProps) => {
  const [isConnected] = useState(initialConnected);
  const [isDisconnecting] = useState(false);

  const handleConnect = () => {
    return;
  };

  const handleDisconnect = () => {
    return;
  };

  return (
    <Card className="w-full min-w-[270px] shadow-none">
      <CardHeader>
        <CardTitle className="flex flex-row justify-between">
          <div className="flex items-center gap-2">
            <Image
              alt="Hevy"
              className="rounded-sm"
              height={24}
              src="/hevy-logo.png"
              width={24}
            />
            Hevy
          </div>
          <Badge className={cn("gap-1.5 bg-primary/10 text-primary")}>
            <span className={cn("h-1.5 w-1.5 rounded-full bg-primary")} />
            Not Supported
          </Badge>
        </CardTitle>
        <CardDescription>
          Unfortunately, only pro subscriber can access the API
        </CardDescription>
      </CardHeader>
      <CardContent className="flex h-full items-end justify-end">
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
          <Button
            className="w-full"
            disabled
            onClick={handleConnect}
            variant={"outline"}
          >
            Connect to Hevy
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
