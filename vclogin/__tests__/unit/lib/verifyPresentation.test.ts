/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi } from "vitest";
import { importJWK } from "jose";
import * as jwtVerification from "@/lib/jwtVerification";
import type { KeyLike } from "jose";
import {
  verifyAuthenticationPresentation,
  test,
} from "@/lib/verifyPresentation";
import ldpVcEmployee from "@/testdata/presentations/VP_EmployeeCredential.json";
import jwtVPEmployeeResponse from "@/testdata/presentations/JWT_VC_EmployeeCredential.json";

const jwkFromKid = test.jwkFromKid;
const verifyJustCredential = test.verifyJustCredential;
const jwtVpEmployee = jwtVPEmployeeResponse.vp_token;

// WARNING: all of the JSON-LD validations rely on web requests (e.g., contexts, status) and may fail in the future, but proper mocking
// of all those web requests would be lots of work
describe("verifyPresentation", () => {
  it("parses a did:key into a valid jwk", async () => {
    const jwk = jwkFromKid(
      "did:key:z6MkkydsS7aR2ZQRGL89yoFCR95dwVXHsugC4RgLZfrBHGYa#z6MkkydsS7aR2ZQRGL89yoFCR95dwVXHsugC4RgLZfrBHGYa",
    );
    const key = await importJWK(jwk, "EdDSA");
    const ck = key as CryptoKey;
    expect(ck.type).toBe("public");
  });

  it("verifies a valid Employee ldp_vc", async () => {
    const result = await verifyJustCredential(
      ldpVcEmployee.verifiableCredential,
    );
    expect(result).toBe(true);
  });

  it("verifies a valid VP with Employee ldp_vc", async () => {
    const result = await verifyAuthenticationPresentation(ldpVcEmployee);
    expect(result).toBe(true);
  });

  it("verifies a valid Employee jwt_vc", async () => {
    const [_headerB64, payloadB64] = jwtVpEmployee.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    const result = await verifyJustCredential(
      payload.vp.verifiableCredential[0],
    );
    expect(result).toBe(true);
  });

  it("verifies a valid VP with Employee jwt_vc", async () => {
    const realJwtVerifyWrap = jwtVerification.jwtVerifyWrap;
    vi.spyOn(jwtVerification, "jwtVerifyWrap").mockImplementation(
      (token: string, secret: KeyLike | Uint8Array, options = {}) => {
        return realJwtVerifyWrap(token, secret, {
          ...options,
          clockTolerance: "100 years", // allow expired test token
        });
      },
    );
    const result = await verifyAuthenticationPresentation(jwtVpEmployee);
    expect(result).toBe(true);
  });
});
