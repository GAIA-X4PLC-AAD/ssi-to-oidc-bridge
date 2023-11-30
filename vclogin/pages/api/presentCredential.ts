/*
 * Copyright (C) 2023, Software Engineering for Business Information Systems (sebis) <matthes@tum.de>
 * SPDX-License-Identifier: Apache-2.0
 */
import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { verifyAuthenticationPresentation } from "@/lib/verifyPresentation";
import { hydraAdmin } from "@/config/ory";
import { Redis } from "ioredis";
import { isTrustedPresentation } from "@/lib/evaluateTrustPolicy";
import { extractClaims } from "@/lib/extractClaims";

// Multer is a middleware for handling multipart/form-data, which is primarily used for uploading files.
const upload = multer();

// This array will contain the middleware functions for each form field
let uploadMiddleware = upload.fields([
  { name: "subject_id", maxCount: 1 },
  { name: "presentation", maxCount: 1 },
]);

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
      const challenge = req.query["login_challenge"];
      res.status(200).json({
        type: "VerifiablePresentationRequest",
        query: [
          {
            type: "QueryByExample",
            credentialQuery: [
              {
                example: {
                  type: "EmployeeCredential",
                },
              },
            ],
          },
        ],
        challenge: challenge,
        domain: process.env.NEXT_PUBLIC_INTERNET_URL,
      });
    } else if (method === "POST") {
      console.log("LOGIN API POST");
      // @ts-ignore
      uploadMiddleware(req, res, async (err: Error | null) => {
        if (err) {
          // An error occurred when uploading
          console.log(err);
          res.status(500).end();
          return;
        }

        // Parse the JSON string into a JavaScript object
        const presentation = JSON.parse(req.body.presentation);
        console.log("Presentation: \n", req.body.presentation);

        // Verify the presentation and the status of the credential
        if (await verifyAuthenticationPresentation(presentation)) {
          // Evaluate if the VP should be trusted
          if (isTrustedPresentation(presentation)) {
            console.log("Presentation verified");
          } else {
            console.log("Presentation not trusted");
            res.status(500).end();
            return;
          }
          console.log("Presentation verified");
        } else {
          console.log("Presentation invalid");
          res.status(500).end();
          return;
        }

        // Get the user claims
        const userClaims = extractClaims(presentation);
        const challenge = presentation["proof"]["challenge"];
        console.log("Logging in: " + userClaims.id);

        // hydra login
        await hydraAdmin
          .adminGetOAuth2LoginRequest(challenge)
          .then(({ data: loginRequest }) =>
            hydraAdmin
              .adminAcceptOAuth2LoginRequest(challenge, {
                // Subject is an alias for user ID. A subject can be a random string, a UUID, an email address, ....
                subject: userClaims.id,
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
                ...userClaims,
              })
              .then(({ data: body }) => {
                // save the redirect address to redis for the browser
                const MAX_AGE = 30; // 30 seconds
                const EXPIRY_MS = "EX"; // seconds
                redis.set(
                  challenge,
                  String(body.redirect_to),
                  EXPIRY_MS,
                  MAX_AGE,
                );
                console.log(
                  "Wrote redirect for " +
                    userClaims.id +
                    " to redis: " +
                    String(body.redirect_to),
                );
                // phone just get a 200 ok
                res.status(200).end();
              }),
          )
          // This will handle any error that happens when making HTTP calls to hydra
          .catch((_) => res.status(401).end());
      });
    } else {
      res.status(500).end();
    }
  } catch (e) {
    res.status(500).end();
  }
}

export const config = { api: { bodyParser: false } };
