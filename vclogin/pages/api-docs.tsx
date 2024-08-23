/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import swaggerDocument from "../swagger.json";

function ReactSwagger() {
  return <SwaggerUI spec={swaggerDocument} />;
}

export default ReactSwagger;
