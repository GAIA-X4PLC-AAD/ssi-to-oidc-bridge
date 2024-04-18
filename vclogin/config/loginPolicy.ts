/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { promises as fs } from "fs";
import { LoginPolicy } from "@/types/LoginPolicy";

var configuredPolicy: LoginPolicy | undefined = undefined;
fs?.readFile(process.env.LOGIN_POLICY as string, "utf8").then((file) => {
  configuredPolicy = JSON.parse(file);
});

export const getConfiguredLoginPolicy = () => {
  return configuredPolicy;
};

export const getPolicyPath = (scope: string) => {
  let mainPath = "./__generated__";
  return scope === "openid"
    ? `${mainPath}/main.json`
    : `${mainPath}/${scope}.json`;
};

export const mergePolicyFiles = async (scopes: string[]) => {
  let mergedPolicy: LoginPolicy | undefined = [];
  await Promise.all(
    scopes.map(async (scope) => {
      const x = await readPolicy(scope);
      mergedPolicy.push(x); // Assuming each policy is an object and you want to merge them into an array
    }),
  );
  return mergedPolicy;
};

var configuredPolicyByScope: LoginPolicy | undefined = undefined;
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
