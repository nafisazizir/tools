import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import { Activity } from "lucide-react";
import type { Metadata } from "next";
import { apiClient } from "@/lib/api-client";
import { Header } from "../components/header";
import { ActivitiesList } from "./components/activities-list";
import { DataSources } from "./components/data-sources";

const title = "Workouts";
const description = "Track and manage your workout data";

export const metadata: Metadata = {
  title,
  description,
};

const WorkoutsPage = async () => {
  const connectionData = await apiClient.getStravaConnection();
  const connection = connectionData.connected
    ? {
        athleteId: connectionData.athleteId,
        firstname: connectionData.firstname ?? null,
        lastname: connectionData.lastname ?? null,
        profile: connectionData.profile ?? null,
        city: connectionData.city ?? null,
        state: connectionData.state ?? null,
        country: connectionData.country ?? null,
        summit: connectionData.summit ?? null,
      }
    : null;

  const athleteId = connectionData.connected
    ? connection?.athleteId
    : undefined;

  return (
    <>
      <Header page="Workouts" pages={[]} />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <DataSources
          stravaAthleteData={connection ?? undefined}
          stravaConnected={connectionData.connected}
        />

        {athleteId ? (
          <ActivitiesList athleteId={athleteId} />
        ) : (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity />
              </EmptyMedia>
              <EmptyTitle>Start Tracking</EmptyTitle>
              <EmptyDescription>
                Connect a fitness app above to sync and view your workout
                history
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </>
  );
};

export default WorkoutsPage;
