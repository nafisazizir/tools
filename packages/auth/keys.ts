import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      CLERK_SECRET_KEY: z.string().startsWith("sk_").optional(),
      CLERK_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
      ALLOWED_EMAILS: z
        .string()
        .transform((val) => val.split(",").map((email) => email.trim()))
        .pipe(z.array(z.string().email())),
    },
    client: {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
        .string()
        .startsWith("pk_")
        .optional(),
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().startsWith("/"),
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().startsWith("/"),
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().startsWith("/"),
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().startsWith("/"),
    },
    runtimeEnv: {
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
      ALLOWED_EMAILS: process.env.ALLOWED_EMAILS,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
    },
  });
