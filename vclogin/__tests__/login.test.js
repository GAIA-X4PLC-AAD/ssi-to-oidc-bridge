import { render, screen } from "@testing-library/react";
import Login from "@/pages/login";
import "@testing-library/jest-dom";

jest.mock("next/router", () => jest.requireActual("next-router-mock"));
const searchParams = { login_challenge: "123" };
jest.mock("next/navigation", () => ({
  __esModule: true,
  useSearchParams: () => ({
    get: jest.fn((key) => searchParams[key]),
  }),
}));

describe("Login", () => {
  it("renders a heading", () => {
    render(<Login />);
    const heading = screen.getByRole("heading", {
      name: /Bridge/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders a CTA", () => {
    render(<Login />);
    const heading = screen.getByRole("heading", {
      name: /Scan/i,
    });

    expect(heading).toBeInTheDocument();
  });

  it("renders a qr code", () => {
    render(<Login />);
    const mainElement = screen.getByRole("main");
    // find canvas node under mainElement
    const qrCanvas = mainElement.querySelector("canvas");
    expect(qrCanvas).toBeInTheDocument();
  });
});
