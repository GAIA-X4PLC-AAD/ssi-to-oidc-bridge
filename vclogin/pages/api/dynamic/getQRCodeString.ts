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
  const { uuid, userId } = req.body;

  //Generate QR Code String from UUID
  const qrCodeString =
    "openid-vc://?client_id=" +
    userId +
    "&request_uri=" +
    encodeURIComponent(
      process.env.EXTERNAL_URL + "/api/presentCredentialById?login_id=" + uuid,
    );

  return res.status(200).json({ qrCodeString });
}
