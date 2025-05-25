/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { extractClaims } from "@/lib/extractClaims";
import vpEmployee from "@/testdata/presentations/VP_EmployeeCredential.json";
import vpEmail from "@/testdata/presentations/VP_EmailPass.json";
import vpMultiEmail from "@/testdata/presentations/VP_MultiEmailPass.json";
import vpMultiVC from "@/testdata/presentations/VP_MultiVC.json";
import policyAcceptAnything from "@/testdata/policies/acceptAnything.json";
import policyAcceptAnythingMisconfigured from "@/testdata/policies/acceptAnythingMisconfigured.json";
import policyAcceptAnythingMultiVC from "@/testdata/policies/acceptAnythingMultiVC.json";
import policyEmailFromAltme from "@/testdata/policies/acceptEmailFromAltme.json";
import policyEmailFromAltmeConstr from "@/testdata/policies/acceptEmailFromAltmeConstr.json";
import policyEmployeeFromAnyone from "@/testdata/policies/acceptEmployeeFromAnyone.json";
import policyMultiEmailFromAltmeConstr from "@/testdata/policies/acceptMultiEmailFromAltmeConstr.json";
import policyMultiVCromAltmeConstr from "@/testdata/policies/acceptMultiVCFromAltmeConstr.json";
import policyAcceptMultiVCMisconfigured from "@/testdata/policies/acceptMultiVCFromAltmeMisconfigured.json";
import { LoginPolicy } from "@/types/LoginPolicy";

import jwtVPEmployeeResponse from "@/testdata/presentations/JWT_VC_EmployeeCredential.json";
const jwtVpEmployee = jwtVPEmployeeResponse.vp_token;

describe("extractClaims", () => {
  it("all subject claims from an EmployeeCredential ldp_vc are extracted", async () => {
    var claims = extractClaims(vpEmployee, policyAcceptAnything);
    var expected = {
      tokenAccess: {},
      tokenId: {
        subjectData: {
          id: "did:key:z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd",
          hash: "9ecf754ffdad0c6de238f60728a90511780b2f7dbe2f0ea015115515f3f389cd",
          leiCode: "391200FJBNU0YW987L26",
          hasLegallyBindingName: "deltaDAO AG",
          ethereumAddress: "0x4C84a36fCDb7Bc750294A7f3B5ad5CA8F74C4A52",
          email: "test@test.com",
          hasRegistrationNumber: "DEK1101R.HRB170364",
          name: "Name Surname",
          hasCountry: "GER",
          type: "EmployeeCredential",
          title: "CEO",
          hasJurisdiction: "GER",
          surname: "Surname",
        },
      },
    };
    expect(claims).toStrictEqual(expected);
  });

  it("all subject claims from an EmployeeCredential jwt_vc are extracted", async () => {
    var claims = extractClaims(jwtVpEmployee, policyAcceptAnything);
    var expected = {
      tokenAccess: {},
      tokenId: {
        subjectData: {
          "gx:headquarterAddress": "Teststreet",
          "gx:legalAddress": "Teststreet",
          "gx:legalName": "Testcompany",
          "gx:parentOrganization": "None",
          "gx:registrationNumber": "1234",
          "gx:subOrganization": "None",
          type: "gx:LegalParticipant",
        },
      },
    };
    expect(claims).toStrictEqual(expected);
  });

  it("all designated claims from an EmailPass Credential ldp_vc are mapped", async () => {
    var claims = extractClaims(vpEmail, policyEmailFromAltme);
    var expected = {
      tokenId: {
        email: "felix.hoops@tum.de",
      },
      tokenAccess: {},
    };
    expect(claims).toStrictEqual(expected);
  });

  it("all designated claims from an EmailPass Credential ldp_vc are mapped (constrained)", async () => {
    var claims = extractClaims(vpEmail, policyEmailFromAltmeConstr);
    var expected = {
      tokenId: {
        email: "felix.hoops@tum.de",
      },
      tokenAccess: {},
    };
    expect(claims).toStrictEqual(expected);
  });

  it("all designated claims from an EmployeeCredential ldp_vc are extracted", async () => {
    var claims = extractClaims(vpEmployee, policyEmployeeFromAnyone);
    var expected = {
      tokenAccess: {},
      tokenId: {
        email: "test@test.com",
        name: "Name Surname",
        companyName: "deltaDAO AG",
      },
    };
    expect(claims).toStrictEqual(expected);
  });

  it("all designated claims from a multi VC (EmailPass) ldp_vc are extracted", async () => {
    var claims = extractClaims(vpMultiEmail, policyMultiEmailFromAltmeConstr);
    var expected = {
      tokenAccess: {},
      tokenId: {
        email: "second.vc@gmail.com",
        type: "EmailPass",
      },
    };
    expect(claims).toStrictEqual(expected);
  });

  it("all designated claims from a multi VC (EmailPass and VerifiableId) ldp_vc are extracted", async () => {
    var claims = extractClaims(vpMultiVC, policyMultiVCromAltmeConstr);
    var expected = {
      tokenAccess: {},
      tokenId: {
        email: "first.vc@gmail.com",
        firstName: "Bianca",
      },
    };
    expect(claims).toStrictEqual(expected);
  });

  it("fails for claims from a multi VC (EmailPass and VerifiableId) ldp_vc with misconfigured policy", async () => {
    expect(() =>
      extractClaims(vpMultiVC, policyAcceptMultiVCMisconfigured as LoginPolicy),
    ).toThrowError();
  });

  it("fails claims from a EmailPass ldp_vc with misconfigured policy", async () => {
    expect(() =>
      extractClaims(vpEmail, policyAcceptAnythingMisconfigured),
    ).toThrowError();
  });

  it("all designated claims from a multi VC (EmailPass and VerifiableId) ldp_vc", async () => {
    var claims = extractClaims(vpMultiVC, policyAcceptAnythingMultiVC);
    var expected = {
      tokenAccess: {},
      tokenId: {
        firstCredentialSubject: {
          email: "first.vc@gmail.com",
          id: "did:key:z6Mkj5B9HcSKWGuuawpBcvy5wQwZJ9g2k5HzfmXPAjwbQ9TT",
          issuedBy: {
            name: "Altme",
          },
          type: "EmailPass",
        },
        secondCredentialSubject: {
          dateIssued: "2022-12-20",
          dateOfBirth: "1930-10-01",
          familyName: "Castafiori",
          firstName: "Bianca",
          gender: "F",
          id: "did:key:z6Mkj5B9HcSKWGuuawpBcvy5wQwZJ9g2k5HzfmXPAjwbQ9TT",
          type: "VerifiableId",
        },
      },
    };
    expect(claims).toStrictEqual(expected);
  });
});
