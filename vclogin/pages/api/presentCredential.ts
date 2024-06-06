/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAuthenticationPresentation } from "@/lib/verifyPresentation";
import { hydraAdmin } from "@/config/ory";
import { Redis } from "ioredis";
import { isTrustedPresentation, extractClaims } from "@/lib/extractClaims";
import * as jose from "jose";
import { keyToDID, keyToVerificationMethod } from "@spruceid/didkit-wasm-node";
import { generatePresentationDefinition } from "@/lib/generatePresentationDefinition";
import { mergePolicyFiles } from "@/config/incrAuthPolicy";
import { mergeInputDescriptors } from "@/config/incrAuthDescriptor";

var redis: Redis;
try {
  redis = new Redis(parseInt(process.env.REDIS_PORT!), process.env.REDIS_HOST!);
} catch (error) {
  console.error("Failed to connect to Redis:", error);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  try {
    const { method } = req;
    if (method === "GET") {
      console.log("LOGIN API GET");
      console.log(req.query);

      const challenge = req.query["login_id"];
      const loginChallenge = (await redis.get("" + challenge))!;

      const scopesRequested = await getScopesRequested(loginChallenge);
      console.log("Scopes Requested: \n", scopesRequested);
      const policyGenerated = await getPolicyGenerated(scopesRequested!);
      console.log("Policy Generated: \n", policyGenerated);
      const descriptorGenerated = await getDescriptorGenerated(
        scopesRequested!,
      );

      console.log("Descriptor Generated: \n", descriptorGenerated);

      const presentation_definition = generatePresentationDefinition(
        policyGenerated!,
        descriptorGenerated,
      );

      console.log("Presentation Definition: \n", presentation_definition);

      const did = await keyToDID("key", process.env.DID_KEY_JWK!);
      const verificationMethod = await keyToVerificationMethod(
        "key",
        process.env.DID_KEY_JWK!,
      );
      const payload = {
        client_id: did,
        client_id_scheme: "did",
        client_metadata_uri: process.env.EXTERNAL_URL + "/api/clientMetadata",
        nonce: challenge,
        presentation_definition,
        response_mode: "direct_post",
        response_type: "vp_token",
        response_uri: process.env.EXTERNAL_URL + "/api/presentCredential",
        state: challenge,
      };
      const privateKey = await jose.importJWK(
        JSON.parse(process.env.DID_KEY_JWK!),
        "EdDSA",
      );
      const token = await new jose.SignJWT(payload)
        .setProtectedHeader({
          alg: "EdDSA",
          kid: verificationMethod,
          typ: "JWT",
        })
        .setIssuedAt()
        .setIssuer(did)
        .setAudience("https://self-issued.me/v2") // by definition
        .setExpirationTime("1 hour")
        .sign(privateKey)
        .catch((err) => {
          console.log(err);
          res.status(500).end();
        });
      console.log("TOKEN: " + token);
      res
        .status(200)
        .appendHeader("Content-Type", "application/oauth-authz-req+jwt")
        .send(token);
    } else if (method === "POST") {
      console.log("LOGIN API POST");

      // Parse the JSON string into a JavaScript object
      const presentation = JSON.parse(req.body.vp_token);
      console.log("Presentation: \n", req.body.vp_token);

      // Get the user claims
      const subject = presentation["holder"];
      const login_id = presentation["proof"]["challenge"];
      const challenge = (await redis.get("" + login_id))!;
      const requestedScopes = await getScopesRequested(challenge);
      const policyGenerated = await getPolicyGenerated(requestedScopes!);
      console.log("Policy Generated: \n", policyGenerated);

      // Verify the presentation and the status of the credential
      if (await verifyAuthenticationPresentation(presentation)) {
        // Evaluate if the VP should be trusted
        if (await isTrustedPresentation(presentation, policyGenerated)) {
          console.log("Presentation verified");
        } else {
          console.log("Presentation not trusted");
          res.status(500).end();
          return;
        }
      } else {
        console.log("Presentation invalid");
        res.status(500).end();
        return;
      }

      const userClaims = await extractClaims(presentation, policyGenerated);

      console.log("Logging in: " + subject + " with challenge: " + challenge);
      console.log("User Claims: \n", userClaims);
      // hydra login
      await hydraAdmin
        .adminGetOAuth2LoginRequest(challenge)
        .then(({ data: loginRequest }) =>
          hydraAdmin
            .adminAcceptOAuth2LoginRequest(challenge, {
              // Subject is an alias for user ID. A subject can be a random string, a UUID, an email address, ....
              subject,
              // This tells hydra to remember the browser and automatically authenticate the user in future requests. This will
              // set the "skip" parameter in the other route to true on subsequent requests!
              remember: Boolean(false),
              // When the session expires, in seconds. Set this to 0 so it will never expire.
              remember_for: 3600,
              // Sets which "level" (e.g. 2-factor authentication) of authentication the user has. The value is really arbitrary
              // and optional. In the context of OpenID Connect, a value of 0 indicates the lowest authorization level.
              // acr: '0',
              //
              // If the environment variable CONFORMITY_FAKE_CLAIMS is set we are assuming that
              // the app is built for the automated OpenID Connect Conformity Test Suite. You
              // can peak inside the code for some ideas, but be aware that all data is fake
              // and this only exists to fake a login system which works in accordance to OpenID Connect.
              //
              // If that variable is not set, the ACR value will be set to the default passed here ('0')
              acr: "0",
            })
            .then(({ data: body }) => {
              const MAX_AGE = 30; // 30 seconds
              const EXPIRY_MS = "EX"; // seconds

              // save the user claims to redis
              redis.set(
                "" + subject,
                JSON.stringify(userClaims),
                EXPIRY_MS,
                MAX_AGE,
              );

              // save the redirect address to redis for the browser
              redis.set(
                "redirect" + login_id,
                String(body.redirect_to),
                EXPIRY_MS,
                MAX_AGE,
              );
              // phone just gets a 200 ok
              res.status(200).end();
            }),
        )
        // This will handle any error that happens when making HTTP calls to hydra
        .catch((_) => res.status(401).end());
    } else {
      res.status(500).end();
    }
  } catch (e) {
    res.status(500).end();
  }
}

const getScopesRequested = async (loginChallenge: string) => {
  let scopesRequested;
  await hydraAdmin
    .adminGetOAuth2LoginRequest(loginChallenge)
    .then(async ({ data: loginRequest }) => {
      scopesRequested = loginRequest.requested_scope;
    });
  return scopesRequested;
};

const getDescriptorGenerated = async (requestedScopes: string[]) => {
  return await mergeInputDescriptors(requestedScopes);
};
const getPolicyGenerated = async (requestedScopes: string[]) => {
  return await mergePolicyFiles(requestedScopes);
};

export const config = { api: { bodyParser: true } };
