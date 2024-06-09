import { LoginPolicy } from "@/types/LoginPolicy";
import { promises as fs } from "fs";

const policyObj = [
  {
    credentialId: "1",
    type: "VerifiableId",
    patterns: [
      {
        issuer: "did:web:app.altme.io:issuer",
        claims: [
          {
            claimPath: "$.credentialSubject.firstName",
            token: "id_token",
          },
          {
            claimPath: "$.credentialSubject.familyName",
            token: "id_token",
          },
        ],
      },
    ],
  },
  {
    credentialId: "2",
    type: "EmailPass",
    patterns: [
      {
        issuer: "did:web:app.altme.io:issuer",
        claims: [
          {
            claimPath: "$.credentialSubject.email",
            token: "id_token",
          },
        ],
        constraint: {
          op: "equals",
          a: "$2.credentialSubject.id",
          b: "$1.credentialSubject.id",
        },
      },
    ],
  },
];

export const getPolicyPath = (scope: string) => {
  let mainPath = "./init_config/policies";
  return `${mainPath}/${scope}.json`;
};

export const mergePolicyFiles = async (scopes: string[]) => {
  let mergedPolicy: LoginPolicy | undefined = [];
  if (scopes.length === 1 && scopes[0] === "openid")
    return await readPolicy(scopes[0]);
  await Promise.all(
    scopes.map(async (scope) => {
      const policy = await readPolicy(scope);
      for (const p of policy) {
        if (mergedPolicy?.find((mp) => mp.credentialId === p.credentialId))
          continue;
        mergedPolicy?.push(p);
      }
    }),
  );
  return mergedPolicy;
};

const readPolicy = async (scope: string) => {
  try {
    const path = getPolicyPath(scope);
    const file = await fs?.readFile(path, "utf8");
    return JSON.parse(file);
  } catch (error) {
    console.error("Error reading policy:", error);
    throw error;
  }
};
