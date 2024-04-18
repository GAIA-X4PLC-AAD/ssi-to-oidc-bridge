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
  const policy = req.body;

  //Store Policy in Redis with key UUID and value as Policy with an expiry of 5 minutes
  const uuid = crypto.randomUUID();
  try {
    await redis.set(uuid, JSON.stringify(policy), "EX", 300);
    return res.status(200).json({ uuid });
  } catch (error) {
    return res.status(500).json({ error });
  }
}
