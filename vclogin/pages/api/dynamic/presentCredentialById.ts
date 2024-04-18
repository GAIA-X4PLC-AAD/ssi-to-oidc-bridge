import { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "ioredis";
import { generatePresentationDefinition } from "@/lib/generatePresentationDefinition";
import { LoginPolicy } from "@/types/LoginPolicy";
import { keyToDID, keyToVerificationMethod } from "@spruceid/didkit-wasm-node";
import * as jose from "jose";
import { hydraAdmin } from "@/config/ory";
import { extractClaims, isTrustedPresentation } from "@/lib/extractClaims";
import { verifyAuthenticationPresentation } from "@/lib/verifyPresentation";

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

      // generate presentation definition using policy
      const presentation_definition = generatePresentationDefinition(
        policy as unknown as LoginPolicy,
      );

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
          process.env.EXTERNAL_URL + "/api/clientMetadataById",
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
    } else if (method === "POST") {
      console.log("LOGIN API POST BY ID");

      // Parse the JSON string into a JavaScript object
      const presentation = JSON.parse(req.body.vp_token);
      console.log("Presentation: \n", req.body.vp_token);

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
      } else {
        console.log("Presentation invalid");
        res.status(500).end();
        return;
      }

      // Get the user claims
      const userClaims = extractClaims(presentation);
      const subject = presentation["holder"];
      const uuid = presentation["proof"]["challenge"];
      console.log(userClaims);

      res.status(200).end();
      // This will handle any error that happens when making HTTP calls to hydra
    } else {
      res.status(500).end();
    }
  } catch (error) {
    res.status(500).end();
  }
  const { method } = req;
}
