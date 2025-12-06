// Query Keys Factory
// This file doesn't have "use client" so it can be used in both server and client components
export const activitiesKeys = {
  all: ["activities"] as const,
  byAthlete: (athleteId: string) => ["activities", athleteId] as const,
};
