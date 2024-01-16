/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { promises as fs } from "fs";
import { LoginPolicy } from "@/types/LoginPolicy";

var configuredPolicy: LoginPolicy | undefined = undefined;
fs.readFile(process.env.LOGIN_POLICY as string, "utf8").then((file) => {
  configuredPolicy = JSON.parse(file);
});

export const getConfiguredLoginPolicy = () => {
  return configuredPolicy;
};
