/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import {
  verifyCredential,
  verifyPresentation,
} from "@spruceid/didkit-wasm-node";
import { logger } from "@/config/logger";

export const verifyAuthenticationPresentation = async (VP: any) => {
  try {
    if (!VP?.verifiableCredential) {
      logger.error("Unable to find VCs in VP");
      return false;
    }

    if (!(await verifyJustPresentation(VP))) {
      return false;
    }

    const creds = Array.isArray(VP.verifiableCredential)
      ? VP.verifiableCredential
      : [VP.verifiableCredential];

    for (const cred of creds) {
      if (!(await verifyJustCredential(cred))) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error(error, "Failed during VP verification");
    return false;
  }
};

const verifyJustPresentation = async (VP: any): Promise<boolean> => {
  const res = JSON.parse(await verifyPresentation(JSON.stringify(VP), "{}"));
  // If verification is successful
  if (res.errors.length === 0) {
    return true;
  } else {
    logger.error({ errors: res.errors }, "Unable to verify VP");
    return false;
  }
};

const verifyJustCredential = async (VC: any): Promise<boolean> => {
  // Verify the signature on the VC
  const res = JSON.parse(await verifyCredential(JSON.stringify(VC), "{}"));
  // If verification is successful
  if (res?.errors?.length === 0) {
    return true;
  } else {
    logger.error({ errors: res.errors }, "Unable to verify VC");
    return false;
  }
};
