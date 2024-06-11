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
  maxRetriesPerRequest: 10,
};

let redis: Redis;

try {
  redis = new Redis(redisConfig);
} catch (error) {
  logger.error(error, "Critically failed initializing Redis");
}

export const redisGet = async (key: RedisKey): Promise<string | null> => {
  let res = null;
  try {
    res = await redis.get(key);
  } catch (error) {
    logger.error(error, "Redis repeatedly failed to get value");
  }
  return res;
};

export const redisSet = (
  key: RedisKey,
  value: RedisValue,
  seconds: string | number,
) => {
  redis.set(key, value, "EX", seconds);
};
