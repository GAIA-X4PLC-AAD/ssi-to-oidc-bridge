import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const excludePath = [
  "/api/dynamic/presentCredentialById",
  "/api/dynamic/clientMetadataById",
  "/api/presentCredential",
  "/api/clientMetadata",
];

export function middleware(req: NextRequest, res: NextResponse) {
  const authHeader = req.headers.get("Authorization");
  const oidcClientId = authHeader?.split(" ")[1];

  if (excludePath.includes(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (oidcClientId && oidcClientId === process.env.OIDC_CLIENT_ID) {
    return NextResponse.next();
  } else {
    return new Response("Unauthorized", { status: 401 });
  }
}
