/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi } from "vitest";
import { isTrustedPresentation } from "@/lib/extractClaims";
import vpEmployee from "@/testdata/presentations/VP_EmployeeCredential.json";
import vpMultiEmail from "@/testdata/presentations/VP_MultiEmailPass.json";
import vpMultiVC from "@/testdata/presentations/VP_MultiVC.json";
import vpTripleVC from "@/testdata/presentations/VP_TripleVC.json";
import vpEmail from "@/testdata/presentations/VP_EmailPass.json";
import vpTezos from "@/testdata/presentations/VP_TezosAssociatedAddress.json";
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

describe("evaluateLoginPolicy", () => {
  it("defaults to false if no policy is available", async () => {
    vi.stubEnv("LOGIN_POLICY", "");
    var trusted = await isTrustedPresentation(vpEmployee, undefined);
    vi.unstubAllEnvs();
    expect(trusted).toBe(false);
  });

  it("accepts valid VPs with acceptAnything policy", async () => {
    var trusted = await isTrustedPresentation(vpEmployee, policyAcceptAnything);
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(vpEmail, policyAcceptAnything);
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(vpTezos, policyAcceptAnything);
    expect(trusted).toBe(true);
  });

  it("accepts only VP with credential(s) of a certain type", async () => {
    var trusted = await isTrustedPresentation(
      vpEmployee,
      policyEmployeeFromAnyone,
    );
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(vpEmail, policyEmployeeFromAnyone);
    expect(trusted).toBe(false);
    trusted = await isTrustedPresentation(vpTezos, policyEmployeeFromAnyone);
    expect(trusted).toBe(false);
  });

  it("accepts only VP with credential(s) of a certain type from a certain issuer", async () => {
    var trusted = await isTrustedPresentation(vpEmail, policyEmailFromAltme);
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(vpEmployee, policyEmailFromAltme);
    expect(trusted).toBe(false);
    trusted = await isTrustedPresentation(vpTezos, policyEmailFromAltme);
    expect(trusted).toBe(false);
  });

  it("accepts all VP from a certain issuer", async () => {
    var trusted = await isTrustedPresentation(vpEmail, policyFromAltme);
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(vpEmployee, policyFromAltme);
    expect(trusted).toBe(false);
  });

  it("accepts only VP with credential(s) with simple constraint", async () => {
    var trusted = await isTrustedPresentation(
      vpEmail,
      policyEmailFromAltmeConstr,
    );
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(
      vpEmployee,
      policyEmailFromAltmeConstr,
    );
    expect(trusted).toBe(false);
    trusted = await isTrustedPresentation(vpTezos, policyEmailFromAltmeConstr);
    expect(trusted).toBe(false);
  });

  it("accepts only VP with credential(s) with complicated constraint", async () => {
    var trusted = await isTrustedPresentation(
      vpEmployee,
      policyEmployeeFromAnyoneConstr,
    );
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(
      vpEmail,
      policyEmployeeFromAnyoneConstr,
    );
    expect(trusted).toBe(false);
    trusted = await isTrustedPresentation(
      vpTezos,
      policyEmployeeFromAnyoneConstr,
    );
    expect(trusted).toBe(false);
  });

  it("accepts only VP with two credentials (same type of VCs that have common credentialSubject fields) with cross constraints", async () => {
    var trusted = await isTrustedPresentation(
      vpMultiEmail,
      policyMultiEmailFromAltmeConstr,
    );
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(
      vpEmail,
      policyMultiEmailFromAltmeConstr,
    );
    expect(trusted).toBe(false);
    trusted = await isTrustedPresentation(
      vpTezos,
      policyMultiEmailFromAltmeConstr,
    );
    expect(trusted).toBe(false);
  });

  it("accepts only VP with two credentials (same type of VCs that have common credentialSubject fields) with simple constraints", async () => {
    var trusted = await isTrustedPresentation(
      vpMultiEmail,
      policyMultiEmailFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(
      vpEmail,
      policyMultiEmailFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(false);
    trusted = await isTrustedPresentation(
      vpTezos,
      policyMultiEmailFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(false);
  });

  it("accepts only VP with two credentials with cross constraints", async () => {
    var trusted = await isTrustedPresentation(
      vpMultiVC,
      policyMultiVCFromAltmeConstr,
    );
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(
      vpEmail,
      policyMultiVCFromAltmeConstr,
    );
    expect(trusted).toBe(false);
    trusted = await isTrustedPresentation(
      vpMultiEmail,
      policyMultiVCFromAltmeConstr,
    );
    expect(trusted).toBe(false);
  });

  it("accepts only VP with two credentials with simple constraints", async () => {
    var trusted = await isTrustedPresentation(
      vpMultiVC,
      policyMultiVCFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(
      vpEmail,
      policyMultiVCFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(false);
    trusted = await isTrustedPresentation(
      vpMultiEmail,
      policyMultiVCFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(false);
  });

  it("accepts only VP with two credentials with complex constraints", async () => {
    var trusted = await isTrustedPresentation(
      vpMultiVC,
      policyMultiVCFromAltmeComplexConstr,
    );
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(
      vpEmail,
      policyMultiVCFromAltmeComplexConstr,
    );
    expect(trusted).toBe(false);
    trusted = await isTrustedPresentation(
      vpMultiEmail,
      policyMultiVCFromAltmeComplexConstr,
    );
    expect(trusted).toBe(false);
  });

  it("accepts only VP with three credentials with simple constraints", async () => {
    var trusted = await isTrustedPresentation(
      vpTripleVC,
      policyTripleVCSimpleConstr,
    );
    expect(trusted).toBe(true);
    trusted = await isTrustedPresentation(vpEmail, policyTripleVCSimpleConstr);
    expect(trusted).toBe(false);
    trusted = await isTrustedPresentation(
      vpMultiEmail,
      policyTripleVCSimpleConstr,
    );
    expect(trusted).toBe(false);
  });
});
