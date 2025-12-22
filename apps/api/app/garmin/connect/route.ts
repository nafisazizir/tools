import { database, Prisma } from "@repo/database";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";
import { encrypt, GarminClient } from "../../../lib/garmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!(email && password)) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const encryptedEmail = encrypt(email);
    const encryptedPassword = encrypt(password);

    await database.garminConnection.upsert({
      where: { id: 1 },
      update: {
        encryptedEmail,
        encryptedPassword,
        oauth1Token: Prisma.DbNull,
        oauth2Token: Prisma.DbNull,
        lastError: null,
      },
      create: {
        id: 1,
        encryptedEmail,
        encryptedPassword,
      },
    });

    const client = new GarminClient();
    try {
      const profile = await client.testConnection();

      await database.garminConnection.update({
        where: { id: 1 },
        data: {
          displayName: profile.displayName,
          fullName: profile.fullName,
        },
      });

      log.info(`Garmin connected successfully for ${profile.displayName}`);

      return NextResponse.json({
        success: true,
        displayName: profile.displayName,
        fullName: profile.fullName,
      });
    } catch (error) {
      await database.garminConnection.delete({ where: { id: 1 } }).catch(() => {
        // Ignore if already deleted
      });

      const message = error instanceof Error ? error.message : "Unknown error";
      log.error(`Garmin connection failed: ${message}`);

      if (message.includes("MFA") || message.includes("two-factor")) {
        return NextResponse.json(
          {
            error:
              "MFA is not supported. Please disable 2FA on your Garmin account.",
            code: "MFA_NOT_SUPPORTED",
          },
          { status: 400 }
        );
      }

      if (message.includes("invalid") || message.includes("credentials")) {
        return NextResponse.json(
          { error: "Invalid email or password", code: "INVALID_CREDENTIALS" },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: "Failed to connect to Garmin", details: message },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error(`Garmin connect error: ${error}`);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
