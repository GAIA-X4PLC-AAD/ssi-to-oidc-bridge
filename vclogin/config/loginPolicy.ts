import { promises as fs } from "fs";
import { LoginPolicy } from "@/types/LoginPolicy";

var configuredPolicy: LoginPolicy | undefined = undefined;
fs.readFile(process.env.TRUST_POLICY as string, "utf8").then((file) => {
  configuredPolicy = JSON.parse(file);
});

export const getConfiguredLoginPolicy = () => {
  return configuredPolicy;
};
