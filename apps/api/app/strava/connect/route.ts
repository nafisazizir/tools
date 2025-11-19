import { NextResponse } from "next/server";
import { env } from "@/env";

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirectUrl") || "/workouts";

  const stravaAuthUrl = new URL("https://www.strava.com/oauth/authorize");
  stravaAuthUrl.searchParams.append("client_id", env.STRAVA_CLIENT_ID);
  stravaAuthUrl.searchParams.append("redirect_uri", env.STRAVA_REDIRECT_URI);
  stravaAuthUrl.searchParams.append("response_type", "code");
  stravaAuthUrl.searchParams.append("approval_prompt", "auto");
  stravaAuthUrl.searchParams.append("scope", "activity:read_all");
  stravaAuthUrl.searchParams.append("state", redirectUrl);

  return await NextResponse.redirect(stravaAuthUrl.toString());
};
