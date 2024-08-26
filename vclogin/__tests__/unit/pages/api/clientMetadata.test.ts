/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { createMocks } from "node-mocks-http";
import handler from "@/api/clientMetadata";
import type { NextApiRequest, NextApiResponse } from "next";

describe("/api/clientMetadata", () => {
  const mockRequest = () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
      url: "api/clientMetadata",
    });
    return { req, res };
  };

  it("returns 200 OK", async () => {
    const { req, res } = mockRequest();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("returns valid JSON", async () => {
    const { req, res } = mockRequest();

    await handler(req, res);

    expect(res._isJSON()).toBe(true);
    expect(res._getJSONData()).toEqual(
      expect.objectContaining({
        client_name: "SSI-to-OIDC Bridge",
      }),
    );
  });
});
