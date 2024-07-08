/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { verifyCredential } from "@spruceid/didkit-wasm-node";
import { verifyAuthenticationPresentation } from "@/lib/verifyPresentation";
import vpEmployee from "@/testdata/presentations/VP_EmployeeCredential.json";

// WARNING: all of this relies on web requests (e.g., contexts, status) and may fail in the future, but proper mocking
// of all those web requests would be lots of work
describe("verifyPresentation", () => {
  // kind of a sanity check
  it("didkit verifies a valid Employee VC", () => {
    return verifyCredential(
      JSON.stringify(vpEmployee.verifiableCredential),
      "{}",
    ).then((result) => {
      const verifyResult = JSON.parse(result);
      //console.log(verifyResult);
      expect(verifyResult.errors.length).toBe(0);
    });
  });

  it("verifies a valid VP with Employee VC", () => {
    return verifyAuthenticationPresentation(vpEmployee).then((result) => {
      expect(result).toBe(true);
    });
  });
});
