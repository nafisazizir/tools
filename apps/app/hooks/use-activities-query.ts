"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { activitiesKeys } from "@/lib/query-keys";

export function useActivitiesQuery(athleteId: string) {
  return useQuery({
    queryKey: activitiesKeys.byAthlete(athleteId),
    queryFn: () => apiClient.getStravaActivities({ athleteId }),
  });
}

export function useSyncActivitiesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      athleteId: string;
      initialSyncDays?: number;
      editScanWindow?: number;
    }) => apiClient.syncStravaActivities(params),
    onSuccess: (_, variables) => {
      // Invalidate the activities query to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: activitiesKeys.byAthlete(variables.athleteId),
      });
    },
  });
}
