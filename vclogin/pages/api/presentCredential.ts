/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAuthenticationPresentation } from "@/lib/verifyPresentation";
import { hydraAdmin } from "@/config/ory";
import { isTrustedPresentation, extractClaims } from "@/lib/extractClaims";
import * as jose from "jose";
import { keyToDID, keyToVerificationMethod } from "@spruceid/didkit-wasm-node";
import { generatePresentationDefinition } from "@/lib/generatePresentationDefinition";
import { getConfiguredLoginPolicy } from "@/config/loginPolicy";
import { withLogging } from "@/middleware/logging";
import { logger } from "@/config/logger";
import { redisSet, redisGet } from "@/config/redis";
import { jsonFromJWT } from "@/lib/jwtVerification";

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { method } = req;
    if (method === "GET") {
      const presentation_definition = generatePresentationDefinition(
        getConfiguredLoginPolicy()!,
      );
      const did = keyToDID("key", process.env.DID_KEY_JWK!);
      const verificationMethod = await keyToVerificationMethod(
        "key",
        process.env.DID_KEY_JWK!,
      );
      const challenge = req.query["login_id"];
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
          typ: "oauth-authz-req+jwt",
        })
        .setIssuedAt()
        .setIssuer(did)
        .setAudience("https://self-issued.me/v2") // by definition
        .setExpirationTime("1 hour")
        .sign(privateKey)
        .catch((err) => {
          logger.error(err, "Failed signing presentation definition token");
          res.status(500).end();
        });
      res.status(200);
      res.send(token);
    } else if (method === "POST") {
      logger.debug(req.body.vp_token, "Verifiable Presentation was sent");
      // Parse the JSON string into a JavaScript object if it is ldp_vp
      let presentation = req.body.vp_token;
      if (!(presentation.split(".").length === 3)) {
        presentation = JSON.parse(presentation);
      }

      // Verify the presentation and the status of the credential
      if (await verifyAuthenticationPresentation(presentation)) {
        // Evaluate if the VP should be trusted
        if (isTrustedPresentation(presentation)) {
          logger.debug("Verifiable Presentation verified");
        } else {
          logger.debug("Verifiable Presentation not trusted");
          res.status(500).end();
          return;
        }
      } else {
        logger.debug("Verifiable Presentation invalid");
        res.status(500).end();
        return;
      }

      // Get the user claims
      const userClaims = extractClaims(presentation);
      let subject: string, login_id: string;
      if (
        Object.hasOwn(presentation, "holder") &&
        Object.hasOwn(presentation, "proof")
      ) {
        subject = presentation["holder"];
        login_id = presentation["proof"]["challenge"];
      } else {
        const payload = jsonFromJWT(presentation);
        subject = payload.sub;
        login_id = payload.nonce;
      }

      const challenge = (await redisGet("" + login_id))!;
      logger.debug({ subject, challenge }, "Sign-in confirmed");

      // hydra login
      await hydraAdmin
        .getOAuth2LoginRequest({ loginChallenge: challenge })
        .then(({}) =>
          hydraAdmin
            .acceptOAuth2LoginRequest({
              loginChallenge: challenge,
              acceptOAuth2LoginRequest: {
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
              },
            })
            .then(({ data: body }) => {
              const MAX_AGE = 30; // 30 seconds

              // save the user claims to redis
              redisSet("" + subject, JSON.stringify(userClaims), MAX_AGE);

              // save the redirect address to redis for the browser
              redisSet(
                "redirect" + login_id,
                String(body.redirect_to),
                MAX_AGE,
              );

              // phone just gets a 200 ok
              res.status(200).end();
            }),
        )
        // This will handle any error that happens when making HTTP calls to hydra
        .catch((error) => {
          logger.error(error, "Failed to login with hydra");
          res.status(401).end();
        });
    } else {
      res.status(500).end();
    }
  } catch (e) {
    res.status(500).end();
  }
}

export default withLogging(handler);
export const config = { api: { bodyParser: true } };
