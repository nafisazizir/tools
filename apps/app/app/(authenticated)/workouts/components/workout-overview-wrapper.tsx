import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { activitiesKeys, sleepKeys } from "@/lib/query-keys";
import { WorkoutOverview } from "./workout-overview";

const DAYS_TO_FETCH = 14;

type WorkoutOverviewWrapperProps = {
  athleteId: string;
  garminConnected: boolean;
};

export const WorkoutOverviewWrapper = async ({
  athleteId,
  garminConnected,
}: WorkoutOverviewWrapperProps) => {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: activitiesKeys.byAthlete(athleteId),
      queryFn: () => apiClient.getStravaActivities({ athleteId }),
    }),
    garminConnected
      ? queryClient.prefetchQuery({
          queryKey: sleepKeys.data(DAYS_TO_FETCH),
          queryFn: () => apiClient.getGarminSleep({ days: DAYS_TO_FETCH }),
        })
      : Promise.resolve(),
  ]);

  const activitiesData = queryClient.getQueryData<{
    activities: Parameters<typeof WorkoutOverview>[0]["activities"];
  }>(activitiesKeys.byAthlete(athleteId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WorkoutOverview
        activities={activitiesData?.activities ?? []}
        athleteId={athleteId}
        garminConnected={garminConnected}
      />
    </HydrationBoundary>
  );
};
