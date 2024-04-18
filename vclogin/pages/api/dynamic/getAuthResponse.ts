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
  //Get Policy from request body
  const { uuid } = req.body;
  console.log("GET AUTH RESPONSE API");

  // Read auth_res from redis and check if it matches the uuid
  const auth_res = await redis.get("auth_res");
  console.log("auth_res: ", auth_res, uuid);
  try {
    if (auth_res === uuid) {
      console.log("auth_res matches uuid");
      return res.status(200).json({ res: "success" });
    } else {
      return res.status(200).json({ res: "no_match" });
    }
  } catch {
    return res.status(200).json({ res: "error" });
  }
}
