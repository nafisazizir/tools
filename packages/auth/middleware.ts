import { clerkClient, clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const authMiddleware = (
  next?: NextMiddleware,
  allowedEmails?: string[]
): NextMiddleware =>
  clerkMiddleware(async (auth, req: NextRequest, evt: NextFetchEvent) => {
    const { pathname } = req.nextUrl;

    const isAuthRoute =
      pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

    const session = await auth();
    const { userId } = session;

    if (userId && !isAuthRoute && allowedEmails && allowedEmails.length > 0) {
      const client = await clerkClient();

      try {
        const user = await client.users.getUser(userId);
        const primaryEmail = user.emailAddresses.find(
          (email) => email.id === user.primaryEmailAddressId
        )?.emailAddress;

        if (primaryEmail && !allowedEmails.includes(primaryEmail)) {
          await client.users.deleteUser(userId);
          return NextResponse.redirect(
            new URL("/sign-in?error=unauthorized", req.url)
          );
        }
      } catch {
        return NextResponse.redirect(
          new URL("/sign-in?error=unauthorized", req.url)
        );
      }
    }

    if (next) {
      return next(req, evt);
    }

    return NextResponse.next();
  }) as unknown as NextMiddleware;
