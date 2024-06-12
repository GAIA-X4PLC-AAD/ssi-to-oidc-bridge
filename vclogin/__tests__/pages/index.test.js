/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from "@testing-library/react";
import Home from "@/pages/index";
import "@testing-library/jest-dom";

describe("Home", () => {
  it("renders a heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", {
      name: /SSI-to-OIDC\sBridge/i,
    });
    expect(heading).toBeInTheDocument();
  });
});
