/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

export type VcConstraint = {
  op: string;
  a: VcConstraint | string;
  b: VcConstraint | string;
};

export type ClaimEntry = {
  claimPath: string;
  newPath?: string;
  token?: string;
  required?: boolean;
};
export type CredentialPattern = {
  issuer: string;
  claims: ClaimEntry[];
  constraint?: VcConstraint;
};

export type ExpectedCredential = {
  credentialId: string;
  type?: string;
  patterns: CredentialPattern[];
};

export type LoginPolicy = ExpectedCredential[];
