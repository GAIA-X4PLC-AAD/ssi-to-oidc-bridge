import { PresentationDefinition } from "@/types/PresentationDefinition";
import { keyToDID, keyToVerificationMethod } from "@spruceid/didkit-wasm-node";
import * as jose from "jose";
import { NextApiResponse } from "next/types";

/**
 *
 * @param challenge
 * @param client_metadata_uri
 * @param response_uri
 * @param presentation_definition
 * @param res
 */
export const getToken = async (
  challenge: string,
  client_metadata_uri: string,
  response_uri: string,
  presentation_definition: PresentationDefinition,
  res: NextApiResponse<any>,
) => {
  const did = await keyToDID("key", process.env.DID_KEY_JWK!);
  const verificationMethod = await keyToVerificationMethod(
    "key",
    process.env.DID_KEY_JWK!,
  );
  const payload = {
    client_id: did,
    client_id_scheme: "did",
    client_metadata_uri,
    nonce: challenge,
    presentation_definition,
    response_mode: "direct_post",
    response_type: "vp_token",
    response_uri,
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
  return token;
};
