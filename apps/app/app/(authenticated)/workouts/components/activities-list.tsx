import { apiClient } from "@/lib/api-client";
import { ActivitiesListClient } from "./activities-list-client";

type ActivitiesListProps = {
  athleteId: string;
};

export const ActivitiesList = async ({ athleteId }: ActivitiesListProps) => {
  const data = await apiClient.getStravaActivities({ athleteId });

  return <ActivitiesListClient activities={data.activities} athleteId={athleteId} />;
};
