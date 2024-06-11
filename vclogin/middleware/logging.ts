/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { logger } from "@/config/logger";
import { NextApiRequest, NextApiResponse } from "next";
import { pinoHttp } from "pino-http";

const loggerHttp = pinoHttp({ logger: logger });

export const withLogging = (
  handler: (a: NextApiRequest, b: NextApiResponse) => Promise<void>,
) => {
  return async (
    req: NextApiRequest,
    res: NextApiResponse<any>,
  ): Promise<any> => {
    loggerHttp(req, res);
    return handler(req, res);
  };
};
