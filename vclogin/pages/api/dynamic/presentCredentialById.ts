import { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "ioredis";
import { generatePresentationDefinition } from "@/lib/generatePresentationDefinition";
import { ExpectedCredential, LoginPolicy } from "@/types/LoginPolicy";
import { keyToDID, keyToVerificationMethod } from "@spruceid/didkit-wasm-node";
import * as jose from "jose";
import { hydraAdmin } from "@/config/ory";
import { extractClaims, isTrustedPresentation } from "@/lib/extractClaims";
import { verifyAuthenticationPresentation } from "@/lib/verifyPresentation";
import { promises as fs } from "fs";
import { getToken } from "@/lib/getToken";

var redis: Redis;
try {
  redis = new Redis(parseInt(process.env.REDIS_PORT!), process.env.REDIS_HOST!);
} catch (error) {
  console.error("Failed to connect to Redis:", error);
}

const getHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("LOGIN API GET BY ID");

  // Get login_id from query
  const uuid = req.query["login_id"];

  // fetch policy from redis using uuid
  const policy = await redis.get(uuid + "_policy");

  // fetch inputDescriptor from redis using uuid
  const inputDescriptor = await redis.get(uuid + "_inputDescriptor");
  console.log("inputDescriptor: ", JSON.parse(inputDescriptor!));

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
  console.log("LOGIN API POST BY ID");

  // Parse the JSON string into a JavaScript object
  const presentation = JSON.parse(req.body.vp_token);
  console.log("Presentation: \n", req.body.vp_token);

  const uuid = presentation["proof"]["challenge"];
  const policy = await redis.get(uuid + "_policy");

  if (policy) {
    const policyObject = JSON.parse(policy) as LoginPolicy;

    // Constants for Redis to store the authentication result
    const MAX_AGE = 20 * 60;
    const EXPIRY_MS = "EX";

    // Verify the presentation and the status of the credential
    if (await verifyAuthenticationPresentation(presentation)) {
      console.log("Presentation valid");
      // Evaluate if the VP should be trusted
      if (isTrustedPresentation(presentation, policyObject)) {
        console.log("Presentation verified");

        // Get the user claims when the presentation is trusted
        const userClaims = extractClaims(presentation, policyObject);
        console.log(userClaims);

        // Store the authentication result in Redis
        await redis.set(uuid + "_auth-res", "success", EXPIRY_MS, MAX_AGE);

        // Store the user claims in Redis
        await redis.set(
          uuid + "_claims",
          JSON.stringify(userClaims.tokenId),
          EXPIRY_MS,
          MAX_AGE,
        );
      } else {
        console.log("Presentation not trusted");

        await redis.set(
          "auth_res:" + uuid,
          "error_presentation_not_trused",
          EXPIRY_MS,
          MAX_AGE,
        );
        // Wallet gets an error message
        res.status(500).end();
        return;
      }
    } else {
      console.log("Presentation invalid");
      await redis.set(
        "auth_res:" + uuid,
        "error_invalid_presentation",
        EXPIRY_MS,
        MAX_AGE,
      );
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

export default async function handler(
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
