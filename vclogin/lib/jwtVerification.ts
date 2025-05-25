import { jwtVerify } from "jose";
import type { KeyLike } from "jose";

// useful for tests
export async function jwtVerifyWrap(
  token: string,
  secret: KeyLike | Uint8Array,
  options = {},
) {
  return jwtVerify(token, secret, options);
}

export function jsonFromJWT(token: string) {
  const [headerB64, payloadB64] = token.split(".");
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
  return { ...header, ...payload };
}
