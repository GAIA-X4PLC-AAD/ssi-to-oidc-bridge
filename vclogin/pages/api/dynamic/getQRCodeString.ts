import { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "ioredis";
import { logger } from "@/config/logger";

var redis: Redis;
try {
  redis = new Redis(parseInt(process.env.REDIS_PORT!), process.env.REDIS_HOST!);
} catch (error) {
  logger.error("Failed to connect to Redis:", error);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  const { userId, uuid } = req.body;

  //Generate QR Code String from UUID
  const qrCodeString =
    "openid-vc://?client_id=" +
    userId +
    "&request_uri=" +
    encodeURIComponent(
      process.env.EXTERNAL_URL +
        "/api/dynamic/presentCredentialById?login_id=" +
        uuid,
    );

  return res.status(200).json({ qrCodeString });
}
