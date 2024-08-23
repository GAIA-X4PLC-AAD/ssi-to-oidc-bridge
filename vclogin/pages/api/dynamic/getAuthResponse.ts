/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { NextApiRequest, NextApiResponse } from "next";
import { logger } from "@/config/logger";
import { redisGet } from "@/config/redis";
import { withLogging } from "@/middleware/logging";

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  //read uuid from query params
  const uuid = req.query["uuid"];
  logger.debug("uuid: ", uuid);

  // Read auth_res from redis and check if it matches the uuid

  //auth_res kept in redis like auth_res:uuid, read auth_res using uuid
  const auth_res = await redisGet(uuid + "_auth-res");

  if (auth_res) {
    //if auth_res found, return it along claims
    const claims = await redisGet(uuid + "_claims");
    res.status(200).json({ auth_res, claims });
  } else {
    //if auth_res not found, return error
    res.status(200).json({ auth_res: "error_not_found" });
  }
}

export default withLogging(handler);
