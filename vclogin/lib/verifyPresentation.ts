/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import bs58 from "bs58";
import { jwtVerify, JWTVerifyResult } from "jose";
import {
  verifyCredential,
  verifyPresentation,
} from "@spruceid/didkit-wasm-node";
import { logger } from "@/config/logger";

export const verifyAuthenticationPresentation = async (VP: any) => {
  try {
    if (!(await verifyJustPresentation(VP))) {
      return false;
    }

    let creds;
    if (typeof VP === "string" && VP.split(".").length === 3) {
      const { payload, protectedHeader } = await verifyJWT(VP);

      creds = Array.isArray(payload.verifiableCredential)
        ? payload.verifiableCredential
        : [payload.verifiableCredential];
    } else {
      creds = Array.isArray(VP.verifiableCredential)
        ? VP.verifiableCredential
        : [VP.verifiableCredential];
    }

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

const jwkFromDID = async (did: string) => {
  if (did.startsWith("did:key")) {
    const split = did.split("#");
    key58 =
      split.length == 2
        ? split[1]
        : did.replace(/^did:key:/, "").replace(/^z/, "");
    const decoded = bs58.decode(key58);
    const ed25519PubKeyBytes = decoded.slice(2); // remove multicodec prefix (0xED01)
    if (decoded[0] !== 0xed || decoded[1] !== 0x01) {
      throw new Error("Not a valid Ed25519 did:key");
    }
    const x = Buffer.from(ed25519PubKeyBytes).toString("base64url");

    return {
      kty: "OKP",
      crv: "Ed25519",
      x,
    };
  }
  //TODO: add support for did:pkh:tezos
  throw new Error("Unable to get key from JWT VC/VP");
};

const verifyJWT = async (token: string) => {
  const [headerB64] = jwt.split(".");
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
  const did = header.kid;
  let jwk = jwkFromDID(did);
  const key = await importJWK(jwk, "EdDSA");
  const { payload, protectedHeader } = await jwtVerify(jwt, key);
  return { payload, protectedHeader };
};

const verifyJustPresentation = async (VP: any): Promise<boolean> => {
  if (typeof VP === "string" && VP.split(".").length === 3) {
    // likely a JWT VP
    try {
      const { payload, protectedHeader } = await verifyJWT(VP);
    } catch (error) {
      logger.error({ errors: error }, "Unable to verify JWT VP");
      return false;
    }
    return true;
  } else {
    // likely a JSON-LD VP
    const res = JSON.parse(await verifyPresentation(JSON.stringify(VP), "{}"));
    // If verification is successful
    if (res.errors.length === 0) {
      return true;
    } else {
      logger.error({ errors: res.errors }, "Unable to verify JSON-LD VP");
      return false;
    }
  }
};

const verifyJustCredential = async (VC: any): Promise<boolean> => {
  if (typeof VC === "string" && VC.split(".").length === 3) {
    try {
      const { payload, protectedHeader } = await verifyJWT(VC);
    } catch (error) {
      logger.error({ errors: error }, "Unable to verify JWT VC");
      return false;
    }
    return true;
  } else {
    // Verify the signature on the VC
    const res = JSON.parse(await verifyCredential(JSON.stringify(VC), "{}"));
    // If verification is successful
    if (res?.errors?.length === 0) {
      return true;
    } else {
      logger.error({ errors: res.errors }, "Unable to verify VC");
      return false;
    }
  }
  return false;
};
