"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import swaggerDocument from "../swagger.json";

function ReactSwagger() {
  return <SwaggerUI spec={swaggerDocument} />;
}

export default ReactSwagger;
