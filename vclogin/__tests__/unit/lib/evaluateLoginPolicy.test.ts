/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi } from "vitest";
import { isTrustedPresentation } from "@/lib/extractClaims";
import { reloadConfiguredLoginPolicy } from "@/config/loginPolicy";
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

import jwtVPEmployeeResponse from "@/testdata/presentations/JWT_VC_EmployeeCredential.json";
const jwtVpEmployee = jwtVPEmployeeResponse.vp_token;

describe("evaluateLoginPolicy", () => {
  it("throws error if no policy is available", async () => {
    vi.stubEnv("LOGIN_POLICY", "");
    expect(() => reloadConfiguredLoginPolicy()).toThrowError();
    vi.unstubAllEnvs();
    reloadConfiguredLoginPolicy();
  });

  it("accepts valid VPs with acceptAnything policy", async () => {
    var trusted = isTrustedPresentation(vpEmployee, policyAcceptAnything);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmail, policyAcceptAnything);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpTezos, policyAcceptAnything);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(jwtVpEmployee, policyAcceptAnything);
    expect(trusted).toBe(true);
  });

  it("accepts only VP with credential(s) of a certain type", async () => {
    var trusted = isTrustedPresentation(vpEmployee, policyEmployeeFromAnyone);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmail, policyEmployeeFromAnyone);
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(vpTezos, policyEmployeeFromAnyone);
    expect(trusted).toBe(false);
  });

  it("accepts only VP with credential(s) of a certain type from a certain issuer", async () => {
    var trusted = isTrustedPresentation(vpEmail, policyEmailFromAltme);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmployee, policyEmailFromAltme);
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(vpTezos, policyEmailFromAltme);
    expect(trusted).toBe(false);
  });

  it("accepts all VP from a certain issuer", async () => {
    var trusted = isTrustedPresentation(vpEmail, policyFromAltme);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmployee, policyFromAltme);
    expect(trusted).toBe(false);
  });

  it("accepts only VP with credential(s) with simple constraint", async () => {
    var trusted = isTrustedPresentation(vpEmail, policyEmailFromAltmeConstr);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmployee, policyEmailFromAltmeConstr);
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(vpTezos, policyEmailFromAltmeConstr);
    expect(trusted).toBe(false);
  });

  it("accepts only VP with credential(s) with complicated constraint", async () => {
    var trusted = isTrustedPresentation(
      vpEmployee,
      policyEmployeeFromAnyoneConstr,
    );
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmail, policyEmployeeFromAnyoneConstr);
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(vpTezos, policyEmployeeFromAnyoneConstr);
    expect(trusted).toBe(false);
  });

  it("accepts only VP with two credentials (same type of VCs that have common credentialSubject fields) with cross constraints", async () => {
    var trusted = isTrustedPresentation(
      vpMultiEmail,
      policyMultiEmailFromAltmeConstr,
    );
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmail, policyMultiEmailFromAltmeConstr);
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(vpTezos, policyMultiEmailFromAltmeConstr);
    expect(trusted).toBe(false);
  });

  it("accepts only VP with two credentials (same type of VCs that have common credentialSubject fields) with simple constraints", async () => {
    var trusted = isTrustedPresentation(
      vpMultiEmail,
      policyMultiEmailFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(
      vpEmail,
      policyMultiEmailFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(
      vpTezos,
      policyMultiEmailFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(false);
  });

  it("accepts only VP with two credentials with cross constraints", async () => {
    var trusted = isTrustedPresentation(
      vpMultiVC,
      policyMultiVCFromAltmeConstr,
    );
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmail, policyMultiVCFromAltmeConstr);
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(vpMultiEmail, policyMultiVCFromAltmeConstr);
    expect(trusted).toBe(false);
  });

  it("accepts only VP with two credentials with simple constraints", async () => {
    var trusted = isTrustedPresentation(
      vpMultiVC,
      policyMultiVCFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(
      vpEmail,
      policyMultiVCFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(
      vpMultiEmail,
      policyMultiVCFromAltmeSimpleConstr,
    );
    expect(trusted).toBe(false);
  });

  it("accepts only VP with two credentials with complex constraints", async () => {
    var trusted = isTrustedPresentation(
      vpMultiVC,
      policyMultiVCFromAltmeComplexConstr,
    );
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(
      vpEmail,
      policyMultiVCFromAltmeComplexConstr,
    );
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(
      vpMultiEmail,
      policyMultiVCFromAltmeComplexConstr,
    );
    expect(trusted).toBe(false);
  });

  it("accepts only VP with three credentials with simple constraints", async () => {
    var trusted = isTrustedPresentation(vpTripleVC, policyTripleVCSimpleConstr);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmail, policyTripleVCSimpleConstr);
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(vpMultiEmail, policyTripleVCSimpleConstr);
    expect(trusted).toBe(false);
  });
});
