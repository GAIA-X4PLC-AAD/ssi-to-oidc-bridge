import { isTrustedPresentation } from "@/lib/evaluateTrustPolicy";
import vpEmployee from "@/testdata/presentations/VP_EmployeeCredential.json";
import vpEmail from "@/testdata/presentations/VP_EmailPass.json";
import vpTezos from "@/testdata/presentations/VP_TezosAssociatedAddress.json";
import policyAcceptAnything from "@/testdata/policies/acceptAnything.json";
import policyEmployeeFromAnyone from "@/testdata/policies/acceptEmployeeFromAnyone.json";
import policyEmailFromAltme from "@/testdata/policies/acceptEmailFromAltme.json";
import policyFromAltme from "@/testdata/policies/acceptFromAltme.json";

describe("evaluateTrustPolicy", () => {
  it("defaults to false if no policy is available", () => {
    var trusted = isTrustedPresentation(vpEmployee, undefined);
    expect(trusted).toBe(false);
  });

  it("accepts valid VPs with acceptAnything policy", () => {
    var trusted = isTrustedPresentation(vpEmployee, policyAcceptAnything);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmail, policyAcceptAnything);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpTezos, policyAcceptAnything);
    expect(trusted).toBe(true);
  });

  it("accepts only VP with credential(s) of a certain type", () => {
    var trusted = isTrustedPresentation(vpEmployee, policyEmployeeFromAnyone);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmail, policyEmployeeFromAnyone);
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(vpTezos, policyEmployeeFromAnyone);
    expect(trusted).toBe(false);
  });

  it("accepts only VP with credential(s) of a certain type from a certain issuer", () => {
    var trusted = isTrustedPresentation(vpEmail, policyEmailFromAltme);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmployee, policyEmailFromAltme);
    expect(trusted).toBe(false);
    trusted = isTrustedPresentation(vpTezos, policyEmailFromAltme);
    expect(trusted).toBe(false);
  });

  it("accepts all VP from a certain issuer", () => {
    var trusted = isTrustedPresentation(vpEmail, policyFromAltme);
    expect(trusted).toBe(true);
    trusted = isTrustedPresentation(vpEmployee, policyFromAltme);
    expect(trusted).toBe(false);
  });
});
