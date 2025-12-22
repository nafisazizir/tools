import { keys as analytics } from "@repo/analytics/keys";
import { keys as auth } from "@repo/auth/keys";
import { keys as database } from "@repo/database/keys";
import { keys as email } from "@repo/email/keys";
import { keys as core } from "@repo/next-config/keys";
import { keys as observability } from "@repo/observability/keys";
import { keys as payments } from "@repo/payments/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const GARMIN_ENCRYPTION_KEY_LENGTH = 64;

export const env = createEnv({
  extends: [
    auth(),
    analytics(),
    core(),
    database(),
    email(),
    observability(),
    payments(),
  ],
  server: {
    STRAVA_CLIENT_ID: z.string().min(1),
    STRAVA_CLIENT_SECRET: z.string().min(1),
    STRAVA_REDIRECT_URI: z.string().url(),
    GARMIN_ENCRYPTION_KEY: z
      .string()
      .length(GARMIN_ENCRYPTION_KEY_LENGTH)
      .optional(),
  },
  client: {},
  runtimeEnv: {
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
    STRAVA_REDIRECT_URI: process.env.STRAVA_REDIRECT_URI,
    GARMIN_ENCRYPTION_KEY: process.env.GARMIN_ENCRYPTION_KEY,
  },
});
