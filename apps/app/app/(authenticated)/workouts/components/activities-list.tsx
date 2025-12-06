import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { activitiesKeys } from "@/lib/query-keys";
import { ActivitiesListClient } from "./activities-list-client";

type ActivitiesListProps = {
  athleteId: string;
};

export const ActivitiesList = async ({ athleteId }: ActivitiesListProps) => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: activitiesKeys.byAthlete(athleteId),
    queryFn: () => apiClient.getStravaActivities({ athleteId }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ActivitiesListClient athleteId={athleteId} />
    </HydrationBoundary>
  );
};
