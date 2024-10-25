/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { promises as fs } from "fs";
import { logger } from "./logger";
import { isLoginPolicy } from "@/lib/isLoginPolicy";
import { LoginPolicy } from "@/types/LoginPolicy";

var configuredPolicy: LoginPolicy | undefined = undefined;

export const reloadConfiguredLoginPolicy = () => {
  if (process.env.LOGIN_POLICY) {
    try {
      fs.readFile(process.env.LOGIN_POLICY as string, "utf8").then((file) => {
        configuredPolicy = JSON.parse(file);
      });
    } catch (error) {
      configuredPolicy = undefined;
      logger.error("Failed to read login policy:", error);
    }
  } else {
    configuredPolicy = undefined;
    logger.error("No login policy set");
    if (process.env.NODE_ENV !== "test") {
      throw Error("No login policy set");
    }
  }

  if (!isLoginPolicy(configuredPolicy)) {
    configuredPolicy = undefined;
    logger.error("Configured login policy has syntax error");
    if (process.env.NODE_ENV !== "test") {
      throw Error("Configured login policy has syntax error");
    }
  }
};

reloadConfiguredLoginPolicy();

export const getConfiguredLoginPolicy = () => {
  return configuredPolicy;
};
