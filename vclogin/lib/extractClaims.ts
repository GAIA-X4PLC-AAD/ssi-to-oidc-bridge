/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import {
  LoginPolicy,
  ClaimEntry,
  CredentialPattern,
  VcConstraint,
} from "@/types/LoginPolicy";
import jp from "jsonpath";
import { getConfiguredLoginPolicy } from "@/config/loginPolicy";
import { logger } from "@/config/logger";

export const isTrustedPresentation = async (VP: any, policy?: LoginPolicy) => {
  var configuredPolicy = await getConfiguredLoginPolicy();
  if (!policy && configuredPolicy === undefined) return false;

  var usedPolicy = policy ? policy : configuredPolicy!;

  const creds = Array.isArray(VP.verifiableCredential)
    ? VP.verifiableCredential
    : [VP.verifiableCredential];

  return getConstraintFit(creds, usedPolicy, VP).length > 0;
};

export const extractClaims = async (VP: any, policy?: LoginPolicy) => {
  var configuredPolicy = await getConfiguredLoginPolicy();
  if (!policy && configuredPolicy === undefined) return false;

  var usedPolicy = policy ? policy : configuredPolicy!;

  logger.info("Used Policy", usedPolicy);
  const creds = Array.isArray(VP.verifiableCredential)
    ? VP.verifiableCredential
    : [VP.verifiableCredential];
  logger.info("Credentials", creds);
  const vcClaims = creds.map((vc: any) => extractClaimsFromVC(vc, usedPolicy));
  logger.info("Extracted VC Claims", vcClaims);
  const claims = vcClaims.reduce(
    (acc: any, vc: any) => Object.assign(acc, vc),
    {},
  );
  logger.info("Extracted Claims", claims);
  return claims;
};

const getConstraintFit = (
  creds: any[],
  policy: LoginPolicy,
  VP: any,
): any[] => {
  const patternFits = getPatternClaimFits(creds, policy);
  const uniqueFits = getAllUniqueDraws(patternFits);
  if (uniqueFits.length === 0) {
    return [];
  }
  for (let fit of uniqueFits) {
    if (isValidConstraintFit(fit, policy, VP)) {
      return fit;
    }
  }
  return [];
};

const getPatternClaimFits = (creds: any[], policy: LoginPolicy): any[][] => {
  // collect all credentials that fit an expected credential claim-wise
  var patternFits = [];
  for (let expectation of policy) {
    let fittingCreds = [];
    for (let cred of creds) {
      if (isCredentialFittingPatternList(cred, expectation.patterns)) {
        fittingCreds.push(cred);
      }
    }
    patternFits.push(fittingCreds);
  }

  return patternFits;
};

const isCredentialFittingPatternList = (
  cred: any,
  patterns: CredentialPattern[],
): boolean => {
  for (let pattern of patterns) {
    if (isCredentialFittingPattern(cred, pattern)) {
      return true;
    }
  }

  return false;
};

const isCredentialFittingPattern = (
  cred: any,
  pattern: CredentialPattern,
): boolean => {
  if (cred.issuer !== pattern.issuer && pattern.issuer !== "*") {
    return false;
  }

  for (const claim of pattern.claims) {
    if (
      (!Object.hasOwn(claim, "required") || claim.required) &&
      jp.paths(cred, claim.claimPath).length === 0
    ) {
      return false;
    }
  }

  return true;
};

const getAllUniqueDraws = (patternFits: any[][]): any[][] => {
  const draws = getAllUniqueDrawsHelper(patternFits, []);
  return draws.filter((draw) => draw.length == patternFits.length);
};

const getAllUniqueDrawsHelper = (
  patternFits: any[][],
  usedIds: any[],
): any[][] => {
  if (patternFits.length === 0) {
    return [];
  }

  let uniqueDraws: any[][] = [];
  for (let cred of patternFits[0]) {
    if (!usedIds.includes(cred.id)) {
      uniqueDraws.push([
        cred,
        ...getAllUniqueDrawsHelper(patternFits.slice(1), [...usedIds, cred.id]),
      ]);
    }
  }
  return uniqueDraws;
};

const isValidConstraintFit = (
  credFit: any[],
  policy: LoginPolicy,
  VP: any,
): boolean => {
  const credDict: any = {};
  credFit = credFit.flat(Infinity);
  for (let i = 0; i < policy.length; i++) {
    credDict[policy[i].credentialId] = credFit[i];
  }

  for (let i = 0; i < policy.length; i++) {
    const cred = credFit[i];
    const expectation = policy[i];
    var oneFittingPattern = false;
    for (let pattern of expectation.patterns) {
      if (isCredentialFittingPattern(cred, pattern)) {
        if (pattern.constraint) {
          const res = evaluateConstraint(
            pattern.constraint,
            cred,
            credDict,
            VP,
          );
          if (res) {
            oneFittingPattern = true;
            break;
          }
        }
      }
    }
    if (!oneFittingPattern) {
      return true;
    }
  }
  return false;
};

const evaluateConstraint = (
  constraint: VcConstraint,
  cred: any,
  credDict: any,
  VP: any,
): boolean => {
  var a = "",
    b = "";
  switch (constraint.op) {
    case "equals":
    case "equalsDID":
    case "startsWith":
    case "endsWith":
    case "matches":
      a = resolveValue(constraint.a as string, cred, credDict, VP);
      b = resolveValue(constraint.b as string, cred, credDict, VP);
  }

  switch (constraint.op) {
    case "equals":
      return a === b;
    case "equalsDID":
      return (
        a.split("#").slice(0, -1).join("#") ===
        b.split("#").slice(0, -1).join("#")
      );
    case "startsWith":
      return a.startsWith(b);
    case "endsWith":
      return a.endsWith(b);
    case "matches":
      return a.match(b) !== null;
    case "and":
      return (
        evaluateConstraint(constraint.a as VcConstraint, cred, credDict, VP) &&
        evaluateConstraint(constraint.b as VcConstraint, cred, credDict, VP)
      );
    case "or":
      return (
        evaluateConstraint(constraint.a as VcConstraint, cred, credDict, VP) ||
        evaluateConstraint(constraint.b as VcConstraint, cred, credDict, VP)
      );
    case "not":
      return !evaluateConstraint(
        constraint.a as VcConstraint,
        cred,
        credDict,
        VP,
      );
  }
  throw Error("Unknown constraint operator: " + constraint.op);
};

const resolveValue = (
  expression: string,
  cred: any,
  credDict: any,
  VP: any,
): string => {
  if (expression.startsWith("$")) {
    var nodes: any;
    if (expression.startsWith("$.")) {
      nodes = jp.nodes(cred, expression);
    } else if (expression.startsWith("$VP.")) {
      nodes = jp.nodes(VP, "$" + expression.slice(3));
    } else {
      nodes = jp.nodes(
        credDict[expression.slice(1).split(".")[0]],
        expression.slice(1).split(".").slice(1).join("."),
      );
    }
    if (nodes.length > 1 || nodes.length <= 0) {
      throw Error("JSON Paths in constraints must be single-valued");
    }
    return nodes[0].value;
  }

  return expression;
};

const extractClaimsFromVC = (VC: any, policy: LoginPolicy) => {
  for (let expectation of policy) {
    logger.info("Expectation", expectation);
    for (let pattern of expectation.patterns) {
      if (pattern.issuer === VC.issuer || pattern.issuer === "*") {
        const containsAllRequired =
          pattern.claims.filter((claim: ClaimEntry) => {
            const claimPathLength = jp.paths(VC, claim.claimPath).length;
            return claim.required && claimPathLength === 1;
          }).length > 0 ||
          pattern.claims.filter((claim: ClaimEntry) => claim.required)
            .length === 0;

        if (!containsAllRequired) {
          continue;
        }

        const extractedClaims = {
          tokenId: {},
          tokenAccess: {},
        };

        for (let claim of pattern.claims) {
          const nodes = jp.nodes(VC, claim.claimPath);
          let newPath = claim.newPath;
          let value: any;

          if (nodes.length > 1) {
            if (!newPath) {
              throw Error(
                "New path not defined for multi-valued claim: " +
                  claim.claimPath,
              );
            }

            value = nodes
              .map((node: any) => {
                const obj: any = {};
                obj[node.path[node.path.length - 1]] = node.value;
                return obj;
              })
              .reduce((acc: any, vals: any) => Object.assign(acc, vals), {});
          } else {
            if (!newPath) {
              newPath = "$." + nodes[0].path[nodes[0].path.length - 1];
            }

            value = nodes[0].value;
          }

          const claimTarget =
            claim.token === "access_token"
              ? extractedClaims.tokenAccess
              : extractedClaims.tokenId;
          jp.value(claimTarget, newPath, value);
        }
        logger.info("Extracted Claims", extractedClaims);
        return extractedClaims;
      }
    }
  }

  return {};
};
