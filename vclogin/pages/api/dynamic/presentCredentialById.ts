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
      console.log("LOGIN API GET BY ID");
      console.log(req.query);
      // Get login_id from query
      const uuid = req.query["login_id"];

      // fetch policy from redis using uuid
      const policy = await redis.get("" + uuid);

      //if policy is found
      if (policy) {
        const policyObject = JSON.parse(policy) as LoginPolicy;

        // generate presentation definition using policy
        const presentation_definition =
          generatePresentationDefinition(policyObject);

        const did = await keyToDID("key", process.env.DID_KEY_JWK!);
        const verificationMethod = await keyToVerificationMethod(
          "key",
          process.env.DID_KEY_JWK!,
        );
        const challenge = req.query["login_id"];
        const payload = {
          client_id: did,
          client_id_scheme: "did",
          client_metadata_uri:
            process.env.EXTERNAL_URL + "/api/dynamic/clientMetadataById",
          nonce: challenge,
          presentation_definition,
          response_mode: "direct_post",
          response_type: "vp_token",
          response_uri:
            process.env.EXTERNAL_URL + "/api/dynamic/presentCredentialById",
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
        console.log("presentation_definition: " + presentation_definition);
        res.send({ status: "success" });
      } else {
        res.status(500).end({ error: "No policy found" });
      }
    } else if (method === "POST") {
      console.log("LOGIN API POST BY ID");

      // Parse the JSON string into a JavaScript object
      const presentation = JSON.parse(req.body.vp_token);
      console.log("Presentation: \n", req.body.vp_token);

      const subject = presentation["holder"];
      const uuid = presentation["proof"]["challenge"];
      const policy = await redis.get("" + uuid);
      console.log("Policy: \n", JSON.parse(policy!));

      if (policy) {
        const policyObject = JSON.parse(policy) as LoginPolicy;

        // Constants for Redis to store the authentication result
        const MAX_AGE = 20 * 60;
        const EXPIRY_MS = "EX";

        // Verify the presentation and the status of the credential
        if (await verifyAuthenticationPresentation(presentation)) {
          // Evaluate if the VP should be trusted
          if (isTrustedPresentation(presentation, policyObject)) {
            console.log("Presentation verified");

            // Get the user claims when the presentation is trusted
            const userClaims = extractClaims(presentation, policyObject);
            console.log(userClaims);

            // Store the authentication result in Redis
            await redis.set("auth_res:" + uuid, "success", EXPIRY_MS, MAX_AGE);
            // Store the user claims in Redis
            await redis.set(
              "claims",
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
    }
  } catch (error) {
    res.status(500).end();
  }
}
