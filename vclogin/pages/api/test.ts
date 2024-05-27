//generate me a simple json returning api

import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  return res.status(200).json({ message: "Hello World" });
}
