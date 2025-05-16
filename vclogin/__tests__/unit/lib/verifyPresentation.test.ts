/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { verifyCredential } from "@spruceid/didkit-wasm-node";
import { verifyAuthenticationPresentation } from "@/lib/verifyPresentation";
import ldpVcEmployee from "@/testdata/presentations/VP_EmployeeCredential.json";
import jwtVPEmployeeResponse from "@/testdata/presentations/JWT_VC_EmployeeCredential.json";

const jwtVpEmployee = jwtVPEmployeeResponse.vp_token;

// WARNING: all of this relies on web requests (e.g., contexts, status) and may fail in the future, but proper mocking
// of all those web requests would be lots of work
describe("verifyPresentation", () => {
  it("verifies a valid Employee ldp_vc", async () => {
    const result = await verifyCredential(
      JSON.stringify(ldpVcEmployee.verifiableCredential),
      "{}",
    );
    const verifyResult = JSON.parse(result);
    expect(verifyResult.errors.length).toBe(0);
  });

  it("verifies a valid VP with Employee ldp_vc", async () => {
    const result = await verifyAuthenticationPresentation(ldpVcEmployee);
    expect(result).toBe(true);
  });

  it("verifies a valid VP with Employee jwt_vc", async () => {
    const result = await verifyAuthenticationPresentation(jwtVpEmployee);
    expect(result).toBe(true);
  });
});
