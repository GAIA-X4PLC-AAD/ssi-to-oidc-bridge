/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { InputDescriptor } from "@/types/InputDescriptor";
import { PresentationDefinition } from "@/types/PresentationDefinition";
import { LoginPolicy } from "@/types/LoginPolicy";
import { promises as fs } from "fs";
import { logger } from "@/config/logger";

var inputDescriptorOverride: any = undefined;
if (process.env.PEX_DESCRIPTOR_OVERRIDE) {
  fs.readFile(process.env.PEX_DESCRIPTOR_OVERRIDE as string, "utf8").then(
    (file) => {
      inputDescriptorOverride = JSON.parse(file);
    },
  );
}

export const generatePresentationDefinition = (
  policy: LoginPolicy,
  incrAuthInputDescriptor?: InputDescriptor[],
) => {
  if (policy === undefined)
    throw Error(
      "A policy must be specified to generate a presentation definition",
    );

  var pd: PresentationDefinition = {
    format: {
      ldp_vc: {
        proof_type: [
          "JsonWebSignature2020",
          "Ed25519Signature2018",
          "EcdsaSecp256k1Signature2019",
          "RsaSignature2018",
        ],
      },
      ldp_vp: {
        proof_type: [
          "JsonWebSignature2020",
          "Ed25519Signature2018",
          "EcdsaSecp256k1Signature2019",
          "RsaSignature2018",
        ],
      },
    },
    id: crypto.randomUUID(),
    name: "SSI-to-OIDC Bridge",
    purpose: "Sign-in",
    input_descriptors: [] as InputDescriptor[],
  };

  if (inputDescriptorOverride && !incrAuthInputDescriptor) {
    pd.input_descriptors = inputDescriptorOverride;
    return pd;
  } else if (incrAuthInputDescriptor) {
    pd.input_descriptors = incrAuthInputDescriptor;
    logger.debug(
      "Using input descriptor override for incremental authorization",
      pd,
    );
    return pd;
  }

  for (let expectation of policy) {
    if (expectation.patterns.length > 1) {
      let req = {
        name: "Group " + expectation.credentialId,
        rule: "pick",
        count: 1,
        from: "group_" + expectation.credentialId,
      };
      pd.submission_requirements!.push(req);
    }

    for (let pattern of expectation.patterns) {
      let descr: InputDescriptor = {
        id: expectation.credentialId,
        purpose: "Sign-in",
        name: "Input descriptor for " + expectation.credentialId,
        constraints: {},
      };

      if (expectation.patterns.length > 1) {
        descr.group = ["group_" + expectation.credentialId];
      }

      let fields = pattern.claims
        .filter((claim) =>
          Object.hasOwn(claim, "required") ? claim.required : true,
        )
        .map((claim) => {
          return {
            path: [claim.claimPath],
            filter: {
              // Altme wallet seems to require the optional filter
              type: "string",
              pattern: "^.*$", // for some reason Altme wallet is picky about this regex and just this variation of "accept everything" works
            },
          };
        });

      if (fields.length > 0) {
        descr.constraints.fields = fields;
      }
      pd.input_descriptors.push(descr);
    }
  }

  // some wallets seem to not support a minimal presentation definition
  // to still make it work for no specific VC to be requested, we just ask for a VerifiableCredential type
  for (let i = 0; i < pd.input_descriptors.length; i++) {
    if (JSON.stringify(pd.input_descriptors[i].constraints) === "{}") {
      pd.input_descriptors[i].constraints = {
        fields: [
          {
            path: ["$.type"],
            filter: {
              type: "string",
              pattern: "VerifiableCredential",
            },
          },
        ],
      };
    }
  }

  return pd;
};
