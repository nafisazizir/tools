import { database } from "@repo/database";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import {
  ScrollArea,
  ScrollBar,
} from "@repo/design-system/components/ui/scroll-area";
import { Workflow } from "lucide-react";
import type { Metadata } from "next";
import { Header } from "../components/header";
import { ActivitiesList } from "./components/activities-list";
import { GarminConnection } from "./components/garmin-connection";
import { HevyConnection } from "./components/hevy-connection";
import { StravaConnection } from "./components/strava-connection";

const title = "Workout";
const description = "Workout data";

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  const connection = await database.stravaConnection.findUnique({
    where: { id: 1 },
  });

  return (
    <>
      <Header page="Workout" pages={[]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <ScrollArea className="w-full">
          <div className="flex flex-row gap-6 pb-4">
            <StravaConnection
              athleteData={connection ? connection : undefined}
              athleteId={connection?.athleteId}
              isConnected={!!connection}
            />
            <GarminConnection athleteId={undefined} isConnected={false} />
            <HevyConnection athleteId={undefined} isConnected={false} />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {connection ? (
          <ActivitiesList athleteId={connection.athleteId} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Workflow />
              </EmptyMedia>
              <EmptyTitle>Let's Get Started</EmptyTitle>
              <EmptyDescription>
                Connect your fitness apps to bring all your workouts together in
                one place
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </>
  );
};

export default App;
