import "server-only";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "./generated/client";
import { keys } from "./keys";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: keys().DATABASE_URL });

export const database = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = database;
}

// biome-ignore lint/performance/noBarrelFile: false positive
export * from "./generated/client";
export { StravaClient } from "./strava-client";
export {
  detailedActivityToPrisma,
  editableFieldsFromSummary,
  hasDetailedData,
  summaryActivityToPrisma,
} from "./strava-transform";
export type * from "./strava-types";
