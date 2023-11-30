import { extractClaims } from "@/lib/extractClaims";
import vpEmployee from "@/testdata/presentations/VP_EmployeeCredential.json";

describe("extractClaims", () => {
  it("all subject claims from an EmployeeCredential are extracted", () => {
    var claims = extractClaims(vpEmployee);
    var expected = {
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
    };
    expect(claims).toStrictEqual(expected);
  });

  //TODO deal with hierarchy in claims and consider mapping
});
