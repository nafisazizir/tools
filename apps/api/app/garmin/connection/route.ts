import { database } from "@repo/database";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const connection = await database.garminConnection.findUnique({
      where: { id: 1 },
      select: {
        displayName: true,
        fullName: true,
        profileImageUrl: true,
        lastSuccessfulSync: true,
        lastError: true,
        createdAt: true,
      },
    });

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      displayName: connection.displayName,
      fullName: connection.fullName,
      profileImageUrl: connection.profileImageUrl,
      lastSuccessfulSync: connection.lastSuccessfulSync?.toISOString() ?? null,
      lastError: connection.lastError,
      connectedAt: connection.createdAt.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch connection: ${error}` },
      { status: 500 }
    );
  }
}
