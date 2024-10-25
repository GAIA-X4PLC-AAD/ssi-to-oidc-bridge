/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { promises as fs } from "fs";
import { logger } from "./logger";
import { LoginPolicy } from "@/types/LoginPolicy";

var configuredPolicy: LoginPolicy | undefined = undefined;
if (process.env.LOGIN_POLICY) {
  try {
    fs.readFile(process.env.LOGIN_POLICY as string, "utf8").then((file) => {
      configuredPolicy = JSON.parse(file);
    });
  } catch (error) {
    logger.error("Failed to read login policy:", error);
  }
} else if (process.env.NODE_ENV !== "test") {
  logger.error("No login policy set");
}

export const getConfiguredLoginPolicy = () => {
  return configuredPolicy;
};
