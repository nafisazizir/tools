import { database } from "@repo/database";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";
import { env } from "@/env";

export const GET = async (request: Request) => {
  const EXPIRATION_MULTIPLIER = 1000;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json(
      { error: "No authorization code provided" },
      { status: 400 }
    );
  }

  try {
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const data = await tokenResponse.json();

    const athleteResponse = await fetch(
      "https://www.strava.com/api/v3/athlete",
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      }
    );

    const athleteData = await athleteResponse.json();

    await database.stravaConnection.upsert({
      where: { id: 1 },
      update: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at * EXPIRATION_MULTIPLIER),
        athleteId: String(data.athlete.id),
        username: athleteData.username,
        firstname: athleteData.firstname,
        lastname: athleteData.lastname,
        city: athleteData.city,
        state: athleteData.state,
        country: athleteData.country,
        summit: athleteData.summit,
        profile: athleteData.profile,
      },
      create: {
        id: 1,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at * EXPIRATION_MULTIPLIER),
        athleteId: String(data.athlete.id),
        username: athleteData.username,
        firstname: athleteData.firstname,
        lastname: athleteData.lastname,
        city: athleteData.city,
        state: athleteData.state,
        country: athleteData.country,
        summit: athleteData.summit,
        profile: athleteData.profile,
      },
    });

    // Redirect back to frontend app
    const frontendPath = state || "/workouts";
    const redirectUrl = new URL(frontendPath, env.NEXT_PUBLIC_APP_URL);
    redirectUrl.searchParams.set("connected", "true");

    return NextResponse.redirect(redirectUrl.toString());
  } catch (anotherError) {
    log.error(`Strava OAuth error: ${anotherError}`);

    // Redirect to frontend with error
    const errorUrl = new URL("/workouts", env.NEXT_PUBLIC_APP_URL);
    errorUrl.searchParams.set("error", "oauth_failed");

    return NextResponse.redirect(errorUrl.toString());
  }
};
