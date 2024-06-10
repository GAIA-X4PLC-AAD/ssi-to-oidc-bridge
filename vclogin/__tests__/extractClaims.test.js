/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { extractClaims } from "@/lib/extractClaims";
import vpEmployee from "@/testdata/presentations/VP_EmployeeCredential.json";
import vpEmail from "@/testdata/presentations/VP_EmailPass.json";
import policyAcceptAnything from "@/testdata/policies/acceptAnything.json";
import policyEmailFromAltme from "@/testdata/policies/acceptEmailFromAltme.json";
import policyEmailFromAltmeConstr from "@/testdata/policies/acceptEmailFromAltmeConstr.json";
import policyEmployeeFromAnyone from "@/testdata/policies/acceptEmployeeFromAnyone.json";

describe("extractClaims", () => {
  it("all subject claims from an EmployeeCredential are extracted", () => {
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

  it("all designated claims from an EmailPass Credential are mapped", () => {
    var claims = extractClaims(vpEmail, policyEmailFromAltme);
    var expected = {
      tokenId: {
        email: "felix.hoops@tum.de",
      },
      tokenAccess: {},
    };
    expect(claims).toStrictEqual(expected);
  });

  it("all designated claims from an EmailPass Credential are mapped (constrained)", () => {
    var claims = extractClaims(vpEmail, policyEmailFromAltmeConstr);
    var expected = {
      tokenId: {
        email: "felix.hoops@tum.de",
      },
      tokenAccess: {},
    };
    expect(claims).toStrictEqual(expected);
  });

  it("all designated claims from an EmployeeCredential are extracted", () => {
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
});
