import { LoginPolicy } from "@/types/LoginPolicy";
import { promises as fs } from "fs";

export const getPolicyPath = (scope: string) => {
  let mainPath = "./__generated__/policies";
  return scope === "openid"
    ? `${mainPath}/main.json`
    : `${mainPath}/${scope}.json`;
};

export const mergePolicyFiles = async (scopes: string[]) => {
  let mergedPolicy: LoginPolicy | undefined = [];
  if (scopes.length === 1 && scopes[0] === "openid")
    return await readPolicy(scopes[0]);
  await Promise.all(
    scopes.map(async (scope) => {
      const policy = await readPolicy(scope);
      mergedPolicy?.push(policy[0]); // Assuming each policy is an object and you want to merge them into an array
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
