import { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "ioredis";

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
  //read uuid from query params
  const uuid = req.query["uuid"];
  console.log("uuid: ", uuid);

  // Read auth_res from redis and check if it matches the uuid

  //auth_res kept in redis like auth_res:uuid, read auth_res using uuid
  const auth_res = await redis.get("auth_res:" + uuid);

  if (auth_res) {
    //if auth_res found, return it along claims
    const claims = await redis.get("claims");
    res.status(200).json({ auth_res, claims });
  } else {
    //if auth_res not found, return error
    res.status(200).json({ auth_res: "error_not_found" });
  }
}
