import { database } from "@repo/database";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const connection = await database.stravaConnection.findUnique({
      where: { id: 1 },
    });

    if (!connection) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    return NextResponse.json({
      connected: true,
      athleteId: connection.athleteId,
      username: connection.username,
      firstname: connection.firstname,
      lastname: connection.lastname,
      city: connection.city,
      state: connection.state,
      country: connection.country,
      summit: connection.summit,
      profile: connection.profile,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch connection ${error}` },
      { status: 500 }
    );
  }
};
