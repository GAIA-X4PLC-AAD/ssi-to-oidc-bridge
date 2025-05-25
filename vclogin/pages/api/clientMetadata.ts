/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { getMetadata } from "@/lib/getMetadata";
import type { NextApiRequest, NextApiResponse } from "next";
import { withLogging } from "@/middleware/logging";

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { method } = req;
    if (method === "GET") {
      const metadata = getMetadata([
        process.env.NEXT_PUBLIC_INTERNET_URL + "/api/presentCredential",
      ]);
      res.status(200).json(metadata);
    } else {
      res.status(500).end();
    }
  } catch (e) {
    res.status(500).end();
  }
}

export const config = { api: { bodyParser: false } };
export default withLogging(handler);
