import { database } from "@repo/database";
import { ActivitiesListClient } from "./activities-list-client";

type ActivitiesListProps = {
  athleteId: string;
};

export const ActivitiesList = async ({ athleteId }: ActivitiesListProps) => {
  const activities = await database.stravaActivity.findMany({
    where: { athlete_id: athleteId },
    orderBy: { start_date: "desc" },
  });

  return <ActivitiesListClient activities={activities} />;
};
