import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = [
  "/api/dynamic/createTempAuthorization",
  "/api/dynamic/getAuthResponse",
  "/api/dynamic/getQRCodeString",
];

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const path = req.nextUrl.pathname;
  const apiKey = authHeader?.split(" ")[1];
  if (protectedPaths.includes(path) && apiKey === process.env.API_KEY) {
    return NextResponse.next();
  } else if (protectedPaths.includes(path) && apiKey !== process.env.API_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }
  return NextResponse.next();
}
