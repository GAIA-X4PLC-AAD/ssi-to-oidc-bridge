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
