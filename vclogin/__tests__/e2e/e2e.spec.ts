/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { test, expect } from "@playwright/test";
import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";
import { GenericContainer, StartedTestContainer } from "testcontainers";

let redisContainer: StartedRedisContainer;
let vcloginContainer: StartedTestContainer;
let url: string;

test.beforeAll(async () => {
  test.setTimeout(240000);
  redisContainer = await new RedisContainer().start();
  const envArgs = {
    REDIS_HOST: `${redisContainer.getIpAddress(
      redisContainer.getNetworkNames()[0] ?? "",
    )}`,
    REDIS_PORT: "6379",
  };
  const vcloginImage = await GenericContainer.fromDockerfile("./")
    .withCache(true)
    .build("vclogin", { deleteOnExit: false });
  vcloginContainer = await vcloginImage
    .withEnvironment(envArgs)
    .withExposedPorts(3000)
    .start();
  url = `http://${vcloginContainer.getHost()}:${vcloginContainer.getFirstMappedPort()}`;
});

test.afterAll(async () => {
  await vcloginContainer.stop();
  await redisContainer.stop();
});

test.describe("Index Page", () => {
  test("has headline", async ({ page }) => {
    await page.goto(url);

    await expect(
      page.getByRole("heading", { name: "SSI-to-OIDC Bridge" }),
    ).toBeVisible();
  });
});

test.describe("Login Page", () => {
  test("has headline", async ({ page }) => {
    await page.goto(url + "/login?login_challenge=challenge123");

    await expect(
      page.getByRole("heading", { name: "SSI-to-OIDC Bridge" }),
    ).toBeVisible();
  });
});
