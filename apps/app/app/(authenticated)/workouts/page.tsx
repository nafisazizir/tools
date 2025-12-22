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
import { GarminSleepDisplay } from "./components/garmin-sleep-display";

const title = "Workouts";
const description = "Track and manage your workout data";

export const metadata: Metadata = {
  title,
  description,
};

const WorkoutsPage = async () => {
  const [stravaConnectionData, garminConnectionResult] = await Promise.all([
    apiClient.getStravaConnection(),
    apiClient.getGarminConnection().catch(() => ({
      connected: false as const,
      displayName: undefined,
      fullName: undefined,
      lastSync: undefined,
      lastError: undefined,
    })),
  ]);

  const stravaConnection = stravaConnectionData.connected
    ? {
        athleteId: stravaConnectionData.athleteId,
        firstname: stravaConnectionData.firstname ?? null,
        lastname: stravaConnectionData.lastname ?? null,
        profile: stravaConnectionData.profile ?? null,
        city: stravaConnectionData.city ?? null,
        state: stravaConnectionData.state ?? null,
        country: stravaConnectionData.country ?? null,
        summit: stravaConnectionData.summit ?? null,
      }
    : null;

  const athleteId = stravaConnectionData.connected
    ? stravaConnection?.athleteId
    : undefined;

  const garminSleepData = garminConnectionResult.connected
    ? await apiClient.getGarminSleep({ days: 14 }).catch(() => ({ data: [] }))
    : { data: [] };

  return (
    <>
      <Header page="Workouts" pages={[]} />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <DataSources
          stravaAthleteData={stravaConnection ?? undefined}
          stravaConnected={stravaConnectionData.connected}
          garminConnected={garminConnectionResult.connected}
          garminConnectionData={
            garminConnectionResult.connected
              ? {
                  displayName: garminConnectionResult.displayName,
                  fullName: garminConnectionResult.fullName,
                }
              : undefined
          }
        />

        <GarminSleepDisplay
          connected={garminConnectionResult.connected}
          sleepData={garminSleepData.data}
          lastSync={garminConnectionResult.lastSync}
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
