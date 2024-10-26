/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { redisSet } from "@/config/redis";
import { withLogging } from "@/middleware/logging";
import { keyToDID } from "@spruceid/didkit-wasm-node";

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  //Get Policy from request body
  const { policy, inputDescriptor } = req.body;

  try {
    // store policy in redis with uuid as key
    const uuid = crypto.randomUUID();
    redisSet(uuid + "_policy", JSON.stringify(policy), 300);

    //check if inputDescriptor is present
    if (inputDescriptor) {
      //store inputDescriptor in redis with uuid as key
      redisSet(uuid + "_inputDescriptor", JSON.stringify(inputDescriptor), 300);
    }

    const did = keyToDID("key", process.env.DID_KEY_JWK!);
    const qrCodeString =
      "openid-vc://?client_id=" +
      did +
      "&request_uri=" +
      encodeURIComponent(
        process.env.EXTERNAL_URL +
          "/api/dynamic/presentCredentialById?login_id=" +
          uuid,
      );

    return res.status(200).json({ uuid, qrCodeString });
  } catch (error) {
    return res.status(500).json({ redirect: "/error" });
  }
}

export default withLogging(handler);
