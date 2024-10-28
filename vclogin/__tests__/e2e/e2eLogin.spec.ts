/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

/* eslint-disable no-console */
import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from "testcontainers";

const delay = (ms: int) => new Promise((resolve) => setTimeout(resolve, ms));

const composeFilePath = "../";
const composeFile = "compose-test.yaml";

let environment: StartedDockerComposeEnvironment;

test.beforeAll(async () => {
  test.setTimeout(120000);
  environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
    .withWaitStrategy(
      "hydra-migrate-1",
      Wait.forLogMessage("Successfully applied migrations!"),
    )
    .withBuild()
    .up();
  delay(6000);
});

test.afterAll(async () => {
  await environment.down();
});

test.describe("Index Page", () => {
  test("has headline", async ({ page }) => {
    await page.goto("http://localhost:5002");

    await expect(
      page.getByRole("heading", { name: "SSI-to-OIDC Bridge" }),
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Login Flow", () => {
  test("sign in with email", async ({ page }) => {
    const testclient = spawn("sh", ["../test_client.sh"], { detached: true });
    testclient.stdout.on("data", (data) => {
      console.error(`stdout: ${data}`);
    });
    testclient.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });
    delay(6000);

    await page.goto("http://localhost:9010");

    await expect(
      page.getByRole("link", { name: "Authorize application" }),
    ).toBeVisible({
      timeout: 15000,
    });
  });
});
