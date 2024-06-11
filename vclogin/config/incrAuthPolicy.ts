import { LoginPolicy } from "@/types/LoginPolicy";
import { promises as fs } from "fs";
import { logger } from "@/config/logger";

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
    logger.error("Error reading policy:", error);
    throw error;
  }
};
