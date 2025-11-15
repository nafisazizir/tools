import { auth } from "@repo/auth/server";
import { database } from "@repo/database";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";
import { env } from "@/env";

export const GET = async (request: Request) => {
  const EXPIRATION_MULTIPLIER = 1000;
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/workouts?error=${error}`, request.url)
    );
  }

  if (!code) {
    return new Response("No authorization code provided", { status: 400 });
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

    await database.stravaConnection.upsert({
      where: { id: 1 },
      update: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at * EXPIRATION_MULTIPLIER),
        athleteId: String(data.athlete.id),
      },
      create: {
        id: 1,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at * EXPIRATION_MULTIPLIER),
        athleteId: String(data.athlete.id),
      },
    });

    return NextResponse.redirect(
      new URL("/workouts?connected=true", request.url)
    );
  } catch (anotherError) {
    log.error(`Strava OAuth error: ${anotherError}`);
    return NextResponse.redirect(
      new URL("/workouts?error=oauth_failed", request.url)
    );
  }
};
