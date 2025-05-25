/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { base58btc } from "multiformats/bases/base58";
import { verifySignature, stringToBytes } from "@taquito/utils";
import { jwtVerifyWrap } from "@/lib/jwtVerification";
import { jsonFromJWT } from "@/lib/jwtVerification";
import { importJWK } from "jose";
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
      const payload = jsonFromJWT(VP);
      creds = Array.isArray(payload.vp.verifiableCredential)
        ? payload.vp.verifiableCredential
        : [payload.vp.verifiableCredential];
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

const jwkFromKid = (kid: string) => {
  if (kid.startsWith("did:key")) {
    const split = kid.split("#");
    const key58 =
      split.length == 2 ? split[1] : kid.replace(/^did:key:/, "").slice(1);
    const decoded = base58btc.decode(key58);
    if (decoded[0] !== 0xed || decoded[1] !== 0x01) {
      throw new Error("Not a valid Ed25519 did:key");
    }
    const ed25519PubKeyBytes = decoded.slice(2); // remove multicodec prefix (0xED01)
    const x = Buffer.from(ed25519PubKeyBytes).toString("base64url");

    return {
      kty: "OKP",
      crv: "Ed25519",
      x,
    };
  }
  throw new Error("Unable to get key from JWT VC/VP");
};

const verifyJWT = async (token: string) => {
  const [headerB64, payloadB64, signatureB64] = token.split(".");
  const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());

  // try normal JWT verification
  try {
    const jwk = jwkFromKid(header.kid);
    const key = await importJWK(jwk, "EdDSA");
    const { payload, protectedHeader } = await jwtVerifyWrap(token, key);
    return { payload, protectedHeader };
  } catch (error) {}

  // try micheline signed JWT-like verification
  // (custom format that allows signing JWT VCs on crypto wallets)
  if (header.alg !== "EdDSA" || header.kid.startsWith("edkp")) {
    throw new Error("Invalid JWT signature");
  }
  const payloadBytes = payloadBytesFromString(headerB64 + "." + payloadB64);
  const publicKey = header.kid;
  const signature = Buffer.from(signatureB64, "base64url").toString("ascii");
  const isVerified = verifySignature(payloadBytes, publicKey, signature);

  if (!isVerified) {
    throw new Error("Invalid JWT signature");
  }

  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
  return { payload, header };
};

// specific to Tezos Micheline signatures and not fully JWT standard compliant
// but only way to support safe signatures from crypto wallets
function payloadBytesFromString(text: string) {
  const bytes = stringToBytes(text);
  const bytesLength = (bytes.length / 2).toString(16);
  const addPadding = `00000000${bytesLength}`;
  const paddedBytesLength = addPadding.slice(addPadding.length - 8);
  return "05" + "01" + paddedBytesLength + bytes;
}

const verifyJustPresentation = async (VP: any): Promise<boolean> => {
  if (typeof VP === "string" && VP.split(".").length === 3) {
    // likely a JWT VP
    try {
      await verifyJWT(VP);
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
      await verifyJWT(VC);
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
};

export const test = {
  verifyJustCredential,
  verifyJWT,
  jwkFromKid,
};
