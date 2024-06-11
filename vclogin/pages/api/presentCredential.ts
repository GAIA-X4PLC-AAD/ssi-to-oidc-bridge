/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAuthenticationPresentation } from "@/lib/verifyPresentation";
import { hydraAdmin } from "@/config/ory";
import { isTrustedPresentation, extractClaims } from "@/lib/extractClaims";
import { generatePresentationDefinition } from "@/lib/generatePresentationDefinition";
import { getConfiguredLoginPolicy } from "@/config/loginPolicy";
import { withLogging } from "@/middleware/logging";
import { logger } from "@/config/logger";
import { redisSet, redisGet } from "@/config/redis";
import * as jose from "jose";
import { getToken } from "@/lib/getToken";

const getHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const presentation_definition = generatePresentationDefinition(
      await getConfiguredLoginPolicy()!,
    );
    const challenge = req.query["login_id"]?.toString();

    if (challenge) {
      const token = await getToken(
        challenge,
        process.env.EXTERNAL_URL + "/api/clientMetadata",
        process.env.EXTERNAL_URL + "/api/presentCredential",
        presentation_definition,
        res,
      );
      if (!token) {
        res.status(500).end();
        return;
      } else {
        res
          .status(200)
          .appendHeader("Content-Type", "application/oauth-authz-req+jwt")
          .send(token);
      }
    }
  } catch {
    res.status(500).end();
  }
};
const postHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    // Parse the JSON string into a JavaScript object
    const presentation = JSON.parse(req.body.vp_token);
    logger.debug(req.body.vp_token, "Verifiable Presentaiton was sent");

    // Verify the presentation and the status of the credential
    if (await verifyAuthenticationPresentation(presentation)) {
      // Evaluate if the VP should be trusted
      if (await isTrustedPresentation(presentation)) {
        logger.debug("Verifiable Presentation verified");
      } else {
        logger.debug("Verifiable Presentation not trusted");
        res.status(500).end();
        return;
      }
    } else {
      logger.debug("Verifiable Presentation not valid");
      res.status(500).end();
      return;
    }

    // Get the user claims
    const userClaims = extractClaims(presentation);
    const subject = presentation["holder"];
    const login_id = presentation["proof"]["challenge"];
    const challenge = (await redisGet("" + login_id))!;
    logger.debug({ subject, challenge }, "Sign-in confirmed");

    // hydra login
    await hydraAdmin
      .adminGetOAuth2LoginRequest(challenge)
      .then(({}) =>
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

            // save the user claims to redis
            redisSet("" + subject, JSON.stringify(userClaims), MAX_AGE);

            // save the redirect address to redis for the browser
            redisSet("redirect" + login_id, String(body.redirect_to), MAX_AGE);

            // phone just gets a 200 ok
            res.status(200).end();
          }),
      )
      // This will handle any error that happens when making HTTP calls to hydra
      .catch((_) => res.status(401).end());
  } catch {
    res.status(500).end();
  }
};

const handlers: any = {
  POST: postHandler,
  GET: getHandler,
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>, //todo look for separate handles
) {
  try {
    const { method } = req;
    if (method && (method === "POST" || method === "GET")) {
      const execute = handlers[method.toUpperCase()];
      return await execute(req, res);
    } else {
      res.status(500).end();
    }
  } catch (error) {
    res.status(500).end();
  }
}
export default withLogging(handler);
export const config = { api: { bodyParser: true } };
