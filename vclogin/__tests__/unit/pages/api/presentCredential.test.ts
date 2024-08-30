/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { RequestMethod, createMocks } from "node-mocks-http";
import handler from "@/api/presentCredential";
import type { NextApiRequest, NextApiResponse } from "next";
import * as jose from "jose";
import { keyToDID, keyToVerificationMethod } from "@spruceid/didkit-wasm-node";

describe("api/test/presentCredential", () => {
  const mockRequest = (method: RequestMethod) => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: method,
      url: "api/presentCredential",
      query: {
        login_challenge: "testchallenge",
      },
    });
    return { req, res };
  };

  it("returns 200 OK", async () => {
    const { req, res } = mockRequest("GET");

    await handler(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("returns valid JWT", async () => {
    const { req, res } = mockRequest("GET");

    await handler(req, res);

    const did = keyToDID("key", process.env.DID_KEY_JWK!);
    const publicKey = await jose.importJWK(
      JSON.parse(process.env.DID_KEY_JWK!),
      "EdDSA",
    );
    const verificationMethod = await keyToVerificationMethod(
      "key",
      process.env.DID_KEY_JWK!,
    );
    const { payload, protectedHeader } = await jose.jwtVerify(
      res._getData(),
      publicKey,
      {
        issuer: did,
        audience: "https://self-issued.me/v2",
      },
    );

    expect(payload).toEqual(
      expect.objectContaining({
        iss: did,
        client_id: did,
        client_id_scheme: "did",
        client_metadata_uri: process.env.EXTERNAL_URL + "/api/clientMetadata",
        response_mode: "direct_post",
        response_type: "vp_token",
        response_uri: process.env.EXTERNAL_URL + "/api/presentCredential",
      }),
    );

    expect(protectedHeader).toEqual({
      alg: "EdDSA",
      kid: verificationMethod,
      typ: "oauth-authz-req+jwt",
    });

    // check that the payload contains a presentation_definition member
  });
});
