"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { sleepKeys } from "@/lib/query-keys";

export type SleepDataSummary = {
  date: string;
  sleepScore: number | null;
  totalHours: number;
  deepHours: number;
  lightHours: number;
  remHours: number;
  awakeHours: number;
  sleepStart: string;
  sleepEnd: string;
  quality: "excellent" | "good" | "fair" | "poor";
};

export function useSleepQuery(days = 14) {
  return useQuery({
    queryKey: sleepKeys.data(days),
    queryFn: () => apiClient.getGarminSleep({ days }),
  });
}

export function useSyncSleepMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { days?: number }) =>
      apiClient.syncGarminSleep(params),
    onSuccess: () => {
      // Invalidate all sleep queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: sleepKeys.all,
      });
    },
  });
}
