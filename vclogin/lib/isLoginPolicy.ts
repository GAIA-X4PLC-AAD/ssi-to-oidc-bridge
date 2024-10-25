/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import {
  ExpectedCredential,
  LoginPolicy,
  VcConstraint,
} from "@/types/LoginPolicy";

// only a somewhat loose type check
const isConstraint = (value: any): value is VcConstraint => {
  if (!value.op || !value.a) {
    return false;
  }

  if (typeof value.a !== "string") {
    if (!isConstraint(value.a)) {
      return false;
    }
  }

  if (value.b && typeof value.b !== "string") {
    if (!isConstraint(value.b)) {
      return false;
    }
  }

  return true;
};

// ensures that all required fields are there
export const isLoginPolicy = (value: any): value is LoginPolicy => {
  if (!Array.isArray(value)) {
    return false;
  }

  for (let val of value) {
    let cred = val as ExpectedCredential;
    if (!cred.credentialId || !cred.patterns) {
      return false;
    }

    for (let pattern of cred.patterns) {
      if (
        !pattern.issuer ||
        !pattern.claims ||
        !Array.isArray(pattern.claims)
      ) {
        return false;
      }

      for (let claim of pattern.claims) {
        if (!claim.claimPath) {
          return false;
        }
      }

      if (pattern.constraint && !isConstraint(pattern.constraint)) {
        return false;
      }
    }
  }

  return true;
};
