import { auth } from "@repo/auth/server";
import { NextResponse } from "next/server";
import { env } from "@/env";

export const GET = async () => {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stravaAuthUrl = new URL("https://www.strava.com/oauth/authorize");
  stravaAuthUrl.searchParams.append("client_id", env.STRAVA_CLIENT_ID);
  stravaAuthUrl.searchParams.append("redirect_uri", env.STRAVA_REDIRECT_URI);
  stravaAuthUrl.searchParams.append("response_type", "code");
  stravaAuthUrl.searchParams.append("approval_prompt", "auto");
  stravaAuthUrl.searchParams.append("scope", "activity:read_all");

  return NextResponse.redirect(stravaAuthUrl.toString());
};
