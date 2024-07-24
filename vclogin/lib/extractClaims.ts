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

  const creds = Array.isArray(VP.verifiableCredential)
    ? VP.verifiableCredential
    : [VP.verifiableCredential];

  const vcClaims = creds.map((vc: any, credentialIndex: number) =>
    // Important: credentialIndex defines helps us to extract the correct claims from the policy
    // Ideally, the credentialIndex should be the same as the credentialId in the policy
    extractClaimsFromVC(vc, usedPolicy, (credentialIndex + 1).toString()),
  );
  const claims: any = {};

  vcClaims.forEach((claim: any) => {
    // Merge tokenId properties
    claims.tokenId = Object.assign({}, claims.tokenId, claim.tokenId);

    // Merge tokenAccess properties
    claims.tokenAccess = Object.assign(
      {},
      claims.tokenAccess,
      claim.tokenAccess,
    );
  });

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
  let fittingArr: boolean[] = [];
  for (let fit of uniqueFits) {
    if (isValidConstraintFit(fit, policy, VP, fittingArr)) {
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
    const claimPath = claim.claimPath.replace(/\$\d+\./g, "$.");
    if (
      (!Object.hasOwn(claim, "required") || claim.required) &&
      jp.paths(cred, claimPath).length === 0
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
  fittingArr: boolean[],
): boolean => {
  const credDict: any = {};
  credFit = credFit.flat(Infinity);
  for (let i = 0; i < policy.length; i++) {
    credDict[policy[i].credentialId] = credFit[i];
  }

  for (let i = 0; i < policy.length; i++) {
    const cred = credFit[i];
    const expectation = policy[i];
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
  // if all items in fittingArr are true, the credentials in a VP are fitting
  if (fittingArr.every((item) => item === true)) {
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

  switch (constraint.op) {
    case "equals":
      return a === b;
    case "equalsDID":
      b = b.includes("#") ? b.split("#").slice(0, -1).join("#") : b;
      return a.split("#").slice(0, -1).join("#") === b;
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
  if (expression.startsWith("$")) {
    var nodes: any;
    if (expression.startsWith("$.")) {
      nodes = jp.nodes(cred, expression);
    } else if (expression.startsWith("$1.")) {
      nodes = jp.nodes(cred, "$" + expression.slice(2));
    } else if (expression.startsWith("$VP.")) {
      nodes = jp.nodes(VP, "$" + expression.slice(3));
    } /*else {
      nodes = jp.nodes(
        credDict[expression.slice(1).split(".")[0]],
        expression.slice(1).split(".").slice(1).join("."),
      );
    }*/
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
          // check if key and key2 are in credDict
          if (keyValues.includes(key2) && keyValues.includes(key)) {
            if (key !== key2 && expression.replace("$", "").startsWith(key)) {
              nodes = jp.nodes(value, expression.slice(key.length + 2));
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

const extractClaimsFromVC = (
  VC: any,
  policy: LoginPolicy,
  credentialIndex: string,
) => {
  let reiterateOuterLoop = false;
  for (let expectation of policy) {
    const credentialId = expectation.credentialId;
    for (let pattern of expectation.patterns) {
      if (credentialId !== credentialIndex) {
        break;
      }
      if (pattern.issuer === VC.issuer || pattern.issuer === "*") {
        const containsAllRequired =
          pattern.claims.filter((claim: ClaimEntry) => {
            const claimPath = claim.claimPath.replace(`${credentialId}`, "");
            const claimPathLength = jp.paths(VC, claimPath).length;
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
          const claimPath = claim.claimPath.replace(`${credentialId}`, "");

          const nodes = jp.nodes(VC, claimPath);
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
              if (nodes.length === 0 || nodes === undefined) {
                reiterateOuterLoop = true;
                break;
              }
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

        if (reiterateOuterLoop) {
          reiterateOuterLoop = false;
          break;
        }

        return extractedClaims;
      }
    }
  }

  return {};
};
