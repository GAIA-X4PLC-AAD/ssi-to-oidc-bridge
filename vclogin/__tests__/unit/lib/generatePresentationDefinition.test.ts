/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from "vitest";
import { generatePresentationDefinition } from "@/lib/generatePresentationDefinition";
import policyAcceptAnything from "@/testdata/policies/acceptAnything.json";
import policyEmployeeFromAnyone from "@/testdata/policies/acceptEmployeeFromAnyone.json";
import policyEmailFromAltme from "@/testdata/policies/acceptEmailFromAltme.json";
import policyFromAltme from "@/testdata/policies/acceptFromAltme.json";
import vpEmail from "@/testdata/presentations/VP_EmailPass.json";
import { Checked, IPresentationDefinition, PEX } from "@sphereon/pex";
import crypto from "crypto";

Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

describe("generatePresentationDefinition", () => {
  it("runs without error", () => {
    expect(generatePresentationDefinition(policyAcceptAnything)).not.toBe(
      undefined,
    );
    expect(generatePresentationDefinition(policyEmployeeFromAnyone)).not.toBe(
      undefined,
    );
    expect(generatePresentationDefinition(policyEmailFromAltme)).not.toBe(
      undefined,
    );
    expect(generatePresentationDefinition(policyFromAltme)).not.toBe(undefined);
  });

  it("produces a valid definition for policyAcceptAnything", () => {
    const def = generatePresentationDefinition(policyAcceptAnything);
    const checkArray = PEX.validateDefinition(
      def as IPresentationDefinition,
    ) as Array<Checked>;
    const problemCount = checkArray.filter(
      (check) => check.status !== "info",
    ).length;
    expect(problemCount).toBe(0);
  });

  it("produces a valid definition for policyEmailFromAltme", () => {
    const def = generatePresentationDefinition(policyEmailFromAltme);
    const checkArray = PEX.validateDefinition(
      def as IPresentationDefinition,
    ) as Array<Checked>;
    const problemCount = checkArray.filter(
      (check) => check.status !== "info",
    ).length;
    expect(problemCount).toBe(0);
  });

  it("produces a definition that accepts a test ldp_vp for anything", () => {
    const pex = new PEX();
    const def = generatePresentationDefinition(policyAcceptAnything);
    const modVP = JSON.parse(JSON.stringify(vpEmail));
    // the PEX library seems to expect the credentials to always be an array
    modVP.verifiableCredential = [vpEmail.verifiableCredential];
    const { warnings, errors } = pex.evaluatePresentation(
      def as IPresentationDefinition,
      modVP,
    );
    expect(warnings!.length).toBe(0);
    expect(errors!.length).toBe(0);
  });

  it("produces a definition that accepts a test ldp_vp for Email", () => {
    const pex = new PEX();
    const def = generatePresentationDefinition(policyEmailFromAltme);
    const modVP = JSON.parse(JSON.stringify(vpEmail));
    // the PEX library seems to expect the credentials to always be an array
    modVP.verifiableCredential = [vpEmail.verifiableCredential];
    const { warnings, errors } = pex.evaluatePresentation(
      def as IPresentationDefinition,
      modVP,
    );
    expect(warnings!.length).toBe(0);
    expect(errors!.length).toBe(0);
  });
});
