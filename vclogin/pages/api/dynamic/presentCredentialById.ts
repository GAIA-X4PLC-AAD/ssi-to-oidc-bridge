/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { NextApiRequest, NextApiResponse } from "next";
import { generatePresentationDefinition } from "@/lib/generatePresentationDefinition";
import { LoginPolicy } from "@/types/LoginPolicy";
import { extractClaims, isTrustedPresentation } from "@/lib/extractClaims";
import { verifyAuthenticationPresentation } from "@/lib/verifyPresentation";
import { getToken } from "@/lib/getToken";
import { logger } from "@/config/logger";
import { redisSet, redisGet } from "@/config/redis";
import { withLogging } from "@/middleware/logging";

const getHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Get login_id from query
  const uuid = req.query["login_id"];

  // fetch policy from redis using uuid
  const policy = await redisGet(uuid + "_policy");

  // fetch inputDescriptor from redis using uuid
  const inputDescriptor = await redisGet(uuid + "_inputDescriptor");
  logger.debug(
    JSON.parse(inputDescriptor!),
    "Input descriptor used by dynamic endpoint",
  );

  //if policy is found
  if (policy) {
    const policyObject = JSON.parse(policy) as LoginPolicy;

    // generate presentation definition using policy
    // and inputDescriptor if it exists
    const presentation_definition = generatePresentationDefinition(
      policyObject,
      inputDescriptor ? JSON.parse(inputDescriptor) : undefined,
    );

    const challenge = req.query["login_id"];

    if (challenge) {
      const token = await getToken(
        challenge as string,
        process.env.EXTERNAL_URL + "/api/dynamic/clientMetadataById",
        process.env.EXTERNAL_URL + "/api/dynamic/presentCredentialById",
        presentation_definition,
        res,
      );

      res
        .status(200)
        .appendHeader("Content-Type", "application/oauth-authz-req+jwt")
        .send(token);
    }
  } else {
    res.status(500).end();
    return;
  }
};

const postHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Parse the JSON string into a JavaScript object
  const presentation = JSON.parse(req.body.vp_token);
  logger.debug(req.body.vp_token, "Verifiable Presentation was sent");

  const uuid = presentation["proof"]["challenge"];
  const policy = await redisGet(uuid + "_policy");

  if (policy) {
    const policyObject = JSON.parse(policy) as LoginPolicy;

    // Constants for Redis to store the authentication result
    const MAX_AGE = 20 * 60;

    // Verify the presentation and the status of the credential
    if (await verifyAuthenticationPresentation(presentation)) {
      // Evaluate if the VP should be trusted
      if (await isTrustedPresentation(presentation, policyObject)) {
        logger.debug("Verifiable Presentation verified");

        // Get the user claims when the presentation is trusted
        const userClaims = await extractClaims(presentation, policyObject);
        logger.debug(
          userClaims,
          "Claims extracted from Verifiable Presentation",
        );

        // Store the authentication result in Redis
        redisSet(uuid + "_auth-res", "success", MAX_AGE);

        // Store the user claims in Redis
        redisSet(uuid + "_claims", JSON.stringify(userClaims.tokenId), MAX_AGE);
      } else {
        logger.debug("Verifiable Presentation not trusted");

        redisSet("auth_res:" + uuid, "error_presentation_not_trused", MAX_AGE);
        // Wallet gets an error message
        res.status(500).end();
        return;
      }
    } else {
      logger.debug("Verifiable Presentation invalid");
      redisSet("auth_res:" + uuid, "error_invalid_presentation", MAX_AGE);
      res.status(500).end();
      return;
    }

    // Wallet gets 200 status code
    res.status(200).end();
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
    if (method) {
      const execute = handlers[method.toUpperCase()];
      return await execute(req, res);
    }
  } catch (error) {
    res.status(500).end();
  }
}

export default withLogging(handler);
