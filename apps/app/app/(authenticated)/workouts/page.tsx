import { database } from "@repo/database";
import type { Metadata } from "next";
import { Header } from "../components/header";
import { ActivitiesList } from "./components/activities-list";
import { ActivitiesSync } from "./components/activities-sync";
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
        <div className="flex w-full flex-row gap-6">
          <StravaConnection
            athleteData={connection ? connection : undefined}
            athleteId={connection?.athleteId}
            isConnected={!!connection}
          />
          <GarminConnection athleteId={undefined} isConnected={false} />
          <HevyConnection athleteId={undefined} isConnected={false} />
        </div>

        {connection && (
          <>
            <ActivitiesSync
              athleteId={connection.athleteId}
              isConnected={!!connection}
            />
            <ActivitiesList athleteId={connection.athleteId} />
          </>
        )}
      </div>
    </>
  );
};

export default App;
