import { keys as analytics } from "@repo/analytics/keys";
import { keys as auth } from "@repo/auth/keys";
import { keys as collaboration } from "@repo/collaboration/keys";
import { keys as database } from "@repo/database/keys";
import { keys as email } from "@repo/email/keys";
import { keys as flags } from "@repo/feature-flags/keys";
import { keys as core } from "@repo/next-config/keys";
import { keys as notifications } from "@repo/notifications/keys";
import { keys as observability } from "@repo/observability/keys";
import { keys as security } from "@repo/security/keys";
import { keys as webhooks } from "@repo/webhooks/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  extends: [
    auth(),
    analytics(),
    collaboration(),
    core(),
    database(),
    email(),
    flags(),
    notifications(),
    observability(),
    security(),
    webhooks(),
  ],
  server: {
    STRAVA_CLIENT_ID: z.string().min(1),
    STRAVA_CLIENT_SECRET: z.string().min(1),
    STRAVA_REDIRECT_URI: z.string().url(),
  },
  client: {},
  runtimeEnv: {
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
    STRAVA_REDIRECT_URI: process.env.STRAVA_REDIRECT_URI,
  },
});
