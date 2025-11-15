import { auth } from "@repo/auth/server";
import { database } from "@repo/database";

export const POST = async () => {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await database.stravaConnection.delete({
      where: { id: 1 },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
