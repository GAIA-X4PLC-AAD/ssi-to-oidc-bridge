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
import { jsonFromJWT } from "@/lib/jwtVerification";
import { withLogging } from "@/middleware/logging";

const getHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const uuid = req.query["auth_id"];
  const policy = await redisGet(uuid + "_policy");
  const inputDescriptor = await redisGet(uuid + "_inputDescriptor");
  logger.debug(
    JSON.parse(inputDescriptor!),
    "Input descriptor used by dynamic endpoint",
  );

  if (policy) {
    const policyObject = JSON.parse(policy) as LoginPolicy;

    const presentation_definition = generatePresentationDefinition(
      policyObject,
      inputDescriptor ? JSON.parse(inputDescriptor) : undefined,
    );

    const challenge = uuid;

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
  logger.debug(req.body.vp_token, "Verifiable Presentation was sent");
  // Parse the JSON string into a JavaScript object if it is ldp_vp
  let presentation = req.body.vp_token;
  if (!(presentation.split(".").length === 3)) {
    presentation = JSON.parse(presentation);
  }

  let uuid: string;
  if (
    Object.hasOwn(presentation, "holder") &&
    Object.hasOwn(presentation, "proof")
  ) {
    uuid = presentation["proof"]["challenge"];
  } else {
    const payload = jsonFromJWT(presentation);
    uuid = payload.nonce;
  }

  const policy = await redisGet(uuid + "_policy");

  if (policy) {
    const policyObject = JSON.parse(policy) as LoginPolicy;

    // Constants for Redis to store the authentication result
    const MAX_AGE = 20 * 60;

    if (await verifyAuthenticationPresentation(presentation)) {
      // Evaluate if the VP should be trusted
      if (isTrustedPresentation(presentation, policyObject)) {
        logger.debug("Verifiable Presentation verified");

        // Get the user claims when the presentation is trusted
        const userClaims = extractClaims(presentation, policyObject);
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
