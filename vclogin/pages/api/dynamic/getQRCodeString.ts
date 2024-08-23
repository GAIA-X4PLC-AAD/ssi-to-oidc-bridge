/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { NextApiRequest, NextApiResponse } from "next";

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
