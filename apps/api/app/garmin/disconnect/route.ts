import { database } from "@repo/database";
import { log } from "@repo/observability/log";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await database.garminConnection.delete({
      where: { id: 1 },
    });

    log.info("Garmin disconnected successfully");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
