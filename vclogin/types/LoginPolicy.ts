/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

export type ClaimEntry = {
  claimPath: string;
  newPath?: string;
  token?: string;
  required?: boolean;
};
export type CredentialPattern = {
  issuer: string;
  claims: ClaimEntry[];
};
export type ExpectedCredential = {
  credentialID: string;
  patterns: CredentialPattern[];
};
export type LoginPolicy = ExpectedCredential[];
