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

  for (const val of value) {
    const cred = val as ExpectedCredential;
    if (!cred.credentialId || !cred.patterns) {
      return false;
    }

    // check for conformity of credential id value
    if (/\W/g.test(cred.credentialId)) {
      return false;
    }

    for (const pattern of cred.patterns) {
      if (
        !pattern.issuer ||
        !pattern.claims ||
        !Array.isArray(pattern.claims)
      ) {
        return false;
      }

      for (const claim of pattern.claims) {
        if (!claim.claimPath) {
          return false;
        }
      }

      if (pattern.constraint && !isConstraint(pattern.constraint)) {
        return false;
      }
    }
  }

  // check that ids are unique
  const ids = value.map((cred) => cred.credentialId);
  if (new Set(ids).size !== ids.length) {
    return false;
  }

  return true;
};
