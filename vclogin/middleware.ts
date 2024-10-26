/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // enforce authorization for sensitive endpoints needed for dynamic authorization
  if (req.nextUrl.pathname.startsWith("/api/dynamic")) {
    if (!process.env.INCR_AUTH_API_SECRET) {
      return new Response("Internal Server Error", { status: 500 });
    }
    const authHeader = req.headers.get("Authorization");
    const apiKey = authHeader?.split(" ")[1];
    if (!authHeader || apiKey !== process.env.INCR_AUTH_API_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
  }
  // would like to do logging here but because nextjs middleware runs in Edge Runtime
  // it does not seem to like pino logger
  return NextResponse.next();
}

export const config = {
  matcher: "/(api/.*)",
};
