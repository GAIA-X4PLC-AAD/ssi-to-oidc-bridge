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

export const isTrustedPresentation = (VP: any, policy?: LoginPolicy) => {
  var configuredPolicy = getConfiguredLoginPolicy();
  if (!policy && configuredPolicy === undefined) return false;

  var usedPolicy = policy ? policy : configuredPolicy!;

  const creds = Array.isArray(VP.verifiableCredential)
    ? VP.verifiableCredential
    : [VP.verifiableCredential];

  return getConstraintFit(creds, usedPolicy, VP).length > 0;
};

export const extractClaims = (VP: any, policy?: LoginPolicy) => {
  var configuredPolicy = getConfiguredLoginPolicy();
  if (!policy && configuredPolicy === undefined) return false;

  var usedPolicy = policy ? policy : configuredPolicy!;

  const creds = Array.isArray(VP.verifiableCredential)
    ? VP.verifiableCredential
    : [VP.verifiableCredential];

  const vcClaims = creds.map((vc: any) => extractClaimsFromVC(vc, usedPolicy));
  const claims = vcClaims.reduce(
    (acc: any, vc: any) => Object.assign(acc, vc),
    {},
  );
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
  // get all unique draws of credentials that fit the expected credential claims
  const draws = getAllUniqueDrawsHelper(patternFits, []);
  const filteredPatterns = removeDuplicates(patternFits);
  return draws.filter((draw) => draw.length == filteredPatterns.length);
};

const removeDuplicates = (array: any) => {
  const uniqueElements: any = [];
  return array.filter((subArray: any) => {
    const found = uniqueElements.some((uniqueSubArray: any) => {
      if (uniqueSubArray.length === subArray.length) {
        return subArray.every((element: any, index: any) => {
          const uniqueElement = uniqueSubArray[index];
          return Object.keys(element).every(
            (key) => element[key] === uniqueElement[key],
          );
        });
      }
      return false;
    });
    if (!found) {
      uniqueElements.push(subArray);
      return true;
    }
    return false;
  });
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
  // check if all constraints are fulfilled
  var fittingArr = [];

  for (let i = 0; i < policy.length; i++) {
    const cred = credFit[i];
    const expectation = policy[i];
    for (let pattern of expectation.patterns) {
      if (isCredentialFittingPattern(cred, pattern)) {
        if (pattern.constraint) {
          console.log("pattern", pattern);
          const res = evaluateConstraint(
            pattern.constraint,
            cred,
            credDict,
            VP,
          );
          console.log("res", res);
          if (res) {
            // if one pattern fits, the credential is fitting
            fittingArr.push(true);
          } else {
            // if one pattern does not fit, the credential is not fitting
            fittingArr.push(false);
          }
        }
      }
    }
  }
  console.log("fittingArr", fittingArr);
  // if all patterns fit, the credential is fitting
  if (!fittingArr.includes(false)) {
    return true;
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

  console.log("a", a);
  console.log("b", b);

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

const resolveSingleNodeValue = (
  expression: string,
  cred: any,
  VP: any,
): string => {
  var nodes: any;
  if (expression.startsWith("$")) {
    if (expression.startsWith("$1.")) {
      nodes = jp.nodes(cred, "$" + expression.slice(2));
    } else if (expression.startsWith("$VP.")) {
      nodes = jp.nodes(VP, "$" + expression.slice(3));
    }
    if (nodes === undefined) {
      return expression;
    } else if (nodes.length > 1 || nodes.length <= 0) {
      throw Error("JSON Paths in constraints must be single-valued");
    }
    return nodes[0].value;
  }
  return expression;
};

const resolveValue = (
  expression: string,
  cred: any,
  credDict: any,
  VP: any,
): string => {
  var nodes: any;
  if (Object.entries(credDict).length > 0) {
    // store object key's value in array to prevent querying wrong key
    let keyValues = [];
    for (const [key, value] of Object.entries(credDict)) {
      keyValues.push(key);
    }

    for (const [key, value] of Object.entries(credDict)) {
      if (expression.startsWith("$" + key + ".")) {
        for (const [key2, value2] of Object.entries(credDict)) {
          // check if both keys are in credDict
          if (keyValues.includes(key2) && keyValues.includes(key)) {
            if (key !== key2) {
              nodes = jp.nodes(value2, expression.slice(2 + key.length));
              if (nodes.length <= 1 && nodes.length > 0) {
                return nodes[0].value;
              }
            }
          } else {
            // if key is not found in credDict
            throw Error("Key not found in credDict");
          }
        }
      }
    }
    resolveSingleNodeValue(expression, cred, VP);
  }
  return resolveSingleNodeValue(expression, cred, VP);
};

const extractClaimsFromVC = (VC: any, policy: LoginPolicy) => {
  for (let expectation of policy) {
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
            claim.token === "id_token"
              ? extractedClaims.tokenId
              : extractedClaims.tokenAccess;
          jp.value(claimTarget, newPath, value);
        }

        return extractedClaims;
      }
    }
  }

  return {};
};
