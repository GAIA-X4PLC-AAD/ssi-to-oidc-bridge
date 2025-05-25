/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { logger } from "@/config/logger";
import { NextApiRequest, NextApiResponse } from "next";
import pino from "pino";
import { pinoHttp } from "pino-http";

const loggerHttp = pinoHttp({
  logger: logger,
  serializers: {
    req: pino.stdSerializers.wrapRequestSerializer((r) => {
      return {
        id: r.id,
        method: r.method,
        url: r.url.split("?")[0],
        query: r.query,
        headers: {
          host: r.raw.headers.host,
          "user-agent": r.raw.headers["user-agent"],
          referer: r.raw.headers.referer,
        },
      };
    }),
  },
});

export const withLogging = (
  handler: (_a: NextApiRequest, _b: NextApiResponse) => Promise<void>,
) => {
  return async (
    req: NextApiRequest,
    res: NextApiResponse<any>,
  ): Promise<any> => {
    loggerHttp(req, res);
    return handler(req, res);
  };
};
