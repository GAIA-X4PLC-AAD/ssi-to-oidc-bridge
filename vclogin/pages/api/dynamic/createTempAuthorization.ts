import { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "ioredis";
import crypto from "crypto";

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
  const { policy, inputDescriptor } = JSON.parse(req.body);

  try {
    // store policy in redis with uuid as key
    const uuid = crypto.randomUUID();
    await redis.set(uuid + "_policy", JSON.stringify(policy), "EX", 300);

    //check if inputDescriptor is present
    if (inputDescriptor) {
      //store inputDescriptor in redis with uuid as key
      await redis.set(
        uuid + "_inputDescriptor",
        JSON.stringify(inputDescriptor),
        "EX",
        300,
      );
    }
    return res.status(200).json({ uuid });
  } catch (error) {
    return res.status(500).json({ redirect: "/error" });
  }
}

/*
  //read credential id from policy
  const hash = crypto.createHash("sha256").update(policy).digest("hex");

  try {
    //check if policy already exists
    const existingPolicy = await redis.get(hash);
    if (existingPolicy) {
      return res.status(200).json({ uuid: hash });
    } else {
      try {
        const hash = crypto.createHash("sha256").update(policy).digest("hex");

        await redis.set(hash, JSON.stringify(policy), "EX", 300);

        return res.status(200).json({ uuid: hash });
      } catch (error) {
        return res.status(500).json({ error });
      }
    } */
