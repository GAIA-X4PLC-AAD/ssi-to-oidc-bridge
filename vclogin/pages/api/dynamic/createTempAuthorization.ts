/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { redisSet } from "@/config/redis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
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
    return res.status(200).json({ uuid });
  } catch (error) {
    return res.status(500).json({ redirect: "/error" });
  }
}
