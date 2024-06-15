/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { Redis, RedisKey, RedisOptions, RedisValue } from "ioredis";
import { logger } from "@/config/logger";

const redisConfig: RedisOptions = {
  port: parseInt(process.env.REDIS_PORT ? process.env.REDIS_PORT : "6379", 10),
  host: process.env.REDIS_HOST,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  showFriendlyErrorStack: process.env.NODE_ENV == "development",
};

let redis: Redis;

try {
  redis = new Redis(redisConfig);

  redis.on("error", (error) => {
    if ((error as any).code !== "ECONNREFUSED") {
      logger.debug(
        { type: (error as any).type, message: error.message },
        "Redis produced an error",
      );
    }
  });
} catch (error) {
  logger.error(error, "Critically failed initializing Redis");
}

export const redisGet = async (key: RedisKey): Promise<string | null> => {
  let res = null;
  res = await redis.get(key, (error) => {
    if (error) {
      logger.error(
        { type: (error as any).type, message: error.message },
        "Redis GET error",
      );
    }
  });
  return res;
};

export const redisSet = (
  key: RedisKey,
  value: RedisValue,
  seconds: string | number,
) => {
  redis.set(key, value, "EX", seconds, (error) => {
    if (error) {
      logger.error(
        { type: (error as any).type, message: error.message },
        "Redis SET error",
      );
    }
  });
};
