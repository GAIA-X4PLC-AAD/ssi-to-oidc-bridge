/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { promises as fs } from "fs";
import { isLoginPolicy } from "@/lib/isLoginPolicy";
import { LoginPolicy } from "@/types/LoginPolicy";

var configuredPolicy: LoginPolicy | undefined = undefined;

export const reloadConfiguredLoginPolicy = () => {
  if (process.env.LOGIN_POLICY) {
    try {
      fs.readFile(process.env.LOGIN_POLICY as string, "utf8").then((file) => {
        configuredPolicy = JSON.parse(file);
        if (!isLoginPolicy(configuredPolicy)) {
          throw Error(
            "Configured login policy has syntax error: " + configuredPolicy,
          );
        }
      });
    } catch (error) {
      throw Error(
        "Failed loading login policy from file: " + process.env.LOGIN_POLICY,
      );
    }
  } else {
    throw Error("No login policy file path set");
  }
};

reloadConfiguredLoginPolicy();

export const getConfiguredLoginPolicy = () => {
  return configuredPolicy;
};
