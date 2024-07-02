/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { Configuration, OAuth2ApiFactory } from "@ory/hydra-client";

const baseOptions: any = {};

if (process.env.MOCK_TLS_TERMINATION) {
  baseOptions.headers = { "X-Forwarded-Proto": "https" };
}

const configuration = new Configuration({
  basePath: process.env.HYDRA_ADMIN_URL,
  accessToken: process.env.ORY_API_KEY || process.env.ORY_PAT,
  baseOptions,
});

const hydraAdmin = OAuth2ApiFactory(configuration);

export { hydraAdmin };
