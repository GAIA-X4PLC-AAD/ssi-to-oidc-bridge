/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { isLoginPolicy } from "@/lib/isLoginPolicy";

import vpEmail from "@/testdata/presentations/VP_EmailPass.json";
import policyAcceptAnything from "@/testdata/policies/acceptAnything.json";
import policyEmployeeFromAnyone from "@/testdata/policies/acceptEmployeeFromAnyone.json";
import policyEmailFromAltme from "@/testdata/policies/acceptEmailFromAltme.json";
import policyFromAltme from "@/testdata/policies/acceptFromAltme.json";
import policyEmailFromAltmeConstr from "@/testdata/policies/acceptEmailFromAltmeConstr.json";
import policyEmployeeFromAnyoneConstr from "@/testdata/policies/acceptEmployeeFromAnyoneConstr.json";
import policyMultiEmailFromAltmeConstr from "@/testdata/policies/acceptMultiEmailFromAltmeConstr.json";
import policyMultiEmailFromAltmeSimpleConstr from "@/testdata/policies/acceptMultiEmailFromAltmeSimpleConstr.json";
import policyMultiVCFromAltmeConstr from "@/testdata/policies/acceptMultiVCFromAltmeConstr.json";
import policyMultiVCFromAltmeSimpleConstr from "@/testdata/policies/acceptMultiVCFromAltmeSimpleConstr.json";
import policyMultiVCFromAltmeComplexConstr from "@/testdata/policies/acceptMultiVCFromAltmeComplexConstr.json";
import policyTripleVCSimpleConstr from "@/testdata/policies/acceptTripleVC.json";

describe("isLoginPolicy", () => {
  it("accepts syntactically correct policies", async () => {
    expect(isLoginPolicy(policyAcceptAnything)).toBe(true);
    expect(isLoginPolicy(policyEmployeeFromAnyone)).toBe(true);
    expect(isLoginPolicy(policyEmailFromAltme)).toBe(true);
    expect(isLoginPolicy(policyFromAltme)).toBe(true);
    expect(isLoginPolicy(policyEmailFromAltmeConstr)).toBe(true);
    expect(isLoginPolicy(policyEmployeeFromAnyoneConstr)).toBe(true);
    expect(isLoginPolicy(policyMultiEmailFromAltmeConstr)).toBe(true);
    expect(isLoginPolicy(policyMultiEmailFromAltmeSimpleConstr)).toBe(true);
    expect(isLoginPolicy(policyMultiVCFromAltmeConstr)).toBe(true);
    expect(isLoginPolicy(policyMultiVCFromAltmeSimpleConstr)).toBe(true);
    expect(isLoginPolicy(policyMultiVCFromAltmeComplexConstr)).toBe(true);
    expect(isLoginPolicy(policyTripleVCSimpleConstr)).toBe(true);
  });

  it("rejects syntactically incorrect policies", async () => {
    expect(isLoginPolicy(vpEmail)).toBe(false);
    const badPolicy = JSON.parse(JSON.stringify(policyEmployeeFromAnyone));
    delete badPolicy[0].patterns[0].issuer;
    expect(isLoginPolicy(badPolicy)).toBe(false);
  });
});
