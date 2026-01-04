import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { sleepKeys } from "@/lib/query-keys";
import { SleepTableClient } from "./sleep-table-client";

export const SleepTable = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: sleepKeys.dateRange(undefined, undefined),
    queryFn: () => apiClient.getGarminSleep({ limit: 365 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SleepTableClient />
    </HydrationBoundary>
  );
};
