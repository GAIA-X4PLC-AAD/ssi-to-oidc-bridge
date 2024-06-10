/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { generatePresentationDefinition } from "@/lib/generatePresentationDefinition";
import policyAcceptAnything from "@/testdata/policies/acceptAnything.json";
import policyEmployeeFromAnyone from "@/testdata/policies/acceptEmployeeFromAnyone.json";
import policyEmailFromAltme from "@/testdata/policies/acceptEmailFromAltme.json";
import policyFromAltme from "@/testdata/policies/acceptFromAltme.json";

import crypto from "crypto";

Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

describe("generatePresentationDefinition", () => {
  it("runs without error", () => {
    expect(generatePresentationDefinition(policyAcceptAnything)).not.toBe(
      undefined,
    );
    expect(generatePresentationDefinition(policyEmployeeFromAnyone)).not.toBe(
      undefined,
    );
    expect(generatePresentationDefinition(policyEmailFromAltme)).not.toBe(
      undefined,
    );
    expect(generatePresentationDefinition(policyFromAltme)).not.toBe(undefined);
  });
});
