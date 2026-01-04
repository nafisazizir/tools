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

const DEFAULT_LIMIT = 365;

export function useSleepQuery(days = 14) {
  return useQuery({
    queryKey: sleepKeys.data(days),
    queryFn: () => apiClient.getGarminSleep({ days }),
  });
}

export type SleepQueryParams = {
  startDate?: string;
  endDate?: string;
  limit?: number;
};

export function useSleepRangeQuery(params: SleepQueryParams = {}) {
  return useQuery({
    queryKey: sleepKeys.dateRange(params.startDate, params.endDate),
    queryFn: () =>
      apiClient.getGarminSleep({
        startDate: params.startDate,
        endDate: params.endDate,
        limit: params.limit ?? DEFAULT_LIMIT,
      }),
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
