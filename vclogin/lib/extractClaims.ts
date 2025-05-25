/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import {
  LoginPolicy,
  CredentialPattern,
  VcConstraint,
} from "@/types/LoginPolicy";
import jp from "jsonpath";
import { getConfiguredLoginPolicy } from "@/config/loginPolicy";
import { isLoginPolicy } from "@/lib/isLoginPolicy";
import { jsonFromJWT } from "@/lib/jwtVerification";

const getCredentialsFromPresentation = (VP: any): any[] => {
  let creds;
  if (typeof VP === "string" && VP.split(".").length === 3) {
    const payload = jsonFromJWT(VP);

    creds = Array.isArray(payload.vp.verifiableCredential)
      ? payload.vp.verifiableCredential
      : [payload.vp.verifiableCredential];
    creds = creds.map(jsonFromJWT);
  } else {
    creds = Array.isArray(VP.verifiableCredential)
      ? VP.verifiableCredential
      : [VP.verifiableCredential];
  }

  if (creds.length < 1) {
    throw Error("Verifiable Presentation has no VCs");
  }

  return creds;
};

export const isTrustedPresentation = (VP: any, policy?: LoginPolicy) => {
  var configuredPolicy = getConfiguredLoginPolicy();
  if (!policy && configuredPolicy === undefined) return false;

  if (policy && !isLoginPolicy(policy)) {
    throw Error("Configured login policy has syntax error");
  }

  const usedPolicy = policy ? policy : configuredPolicy!;
  const creds = getCredentialsFromPresentation(VP);

  return getConstraintFit(creds, usedPolicy, VP).length > 0;
};

export const extractClaims = (VP: any, policy?: LoginPolicy) => {
  var configuredPolicy = getConfiguredLoginPolicy();
  if (!policy && configuredPolicy === undefined) return false;

  if (policy && !isLoginPolicy(policy)) {
    throw Error("Configured login policy has syntax error");
  }

  const usedPolicy = policy ? policy : configuredPolicy!;
  const creds = getCredentialsFromPresentation(VP);

  const fit = getConstraintFit(creds, usedPolicy, VP);
  const patternFit = getPatternConstraintFit(fit, usedPolicy, VP);
  const vcClaimsList = [];
  for (let i = 0; i < fit.length; i++) {
    const vc = fit[i];
    const pattern = patternFit[i];
    const vcClaims = extractClaimsFromVC(vc, pattern);
    vcClaimsList.push(vcClaims);
  }

  const deepMerge = (target: any, source: any) => {
    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) {
          Object.assign(target, {
            [key]: {},
          });
        }
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, {
          [key]: source[key],
        });
      }
    }
    return target;
  };

  const claims = vcClaimsList.reduce(
    (acc: any, vc: any) => deepMerge(acc, vc),
    {},
  );
  return claims;
};

const getConstraintFit = (
  creds: any[],
  policy: LoginPolicy,
  VP: any,
): any[] => {
  const credentialFits = getCredentialClaimFits(creds, policy);
  const uniqueFits = getAllUniqueDraws(credentialFits);
  if (uniqueFits.length === 0) {
    return [];
  }
  for (const fit of uniqueFits) {
    if (getPatternConstraintFit(fit, policy, VP).length === fit.length) {
      return fit;
    }
  }
  return [];
};

const getCredentialClaimFits = (creds: any[], policy: LoginPolicy): any[][] => {
  // collect all credentials that fit an expected credential claim-wise
  var credentialFits = [];
  for (const expectation of policy) {
    const fittingCreds = [];
    for (const cred of creds) {
      if (isCredentialFittingPatternList(cred, expectation.patterns)) {
        fittingCreds.push(cred);
      }
    }
    credentialFits.push(fittingCreds);
  }

  return credentialFits;
};

const isCredentialFittingPatternList = (
  cred: any,
  patterns: CredentialPattern[],
): boolean => {
  for (const pattern of patterns) {
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
  if (Object.hasOwn(cred, "vc") && Object.hasOwn(cred, "iss")) {
    if (cred.iss !== pattern.issuer && pattern.issuer !== "*") {
      return false;
    }
  } else if (cred.issuer !== pattern.issuer && pattern.issuer !== "*") {
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

const getAllUniqueDraws = (credentialFits: any[][]): any[][] => {
  const draws = getAllUniqueDrawsHelper(credentialFits, []);
  return draws.filter((draw) => draw.length === credentialFits.length);
};

const getAllUniqueDrawsHelper = (
  credentialFits: any[][],
  usedIds: any[],
): any[][] => {
  if (credentialFits.length === 0) {
    return [[]];
  }

  const uniqueDraws: any[][] = [];
  for (const cred of credentialFits[0]) {
    if (!usedIds.includes(cred.id)) {
      const furtherDraws = getAllUniqueDrawsHelper(credentialFits.slice(1), [
        ...usedIds,
        cred.id,
      ]);
      for (const draw of furtherDraws) {
        uniqueDraws.push([cred, ...draw]);
      }
    }
  }
  return uniqueDraws;
};

const getPatternConstraintFit = (
  credFit: any[],
  policy: LoginPolicy,
  VP: any,
): CredentialPattern[] => {
  const credDict: any = {};
  for (let i = 0; i < policy.length; i++) {
    credDict[policy[i].credentialId] = credFit[i];
  }

  const patternList: CredentialPattern[] = [];
  for (let i = 0; i < policy.length; i++) {
    const cred = credFit[i];
    const expectation = policy[i];
    var oneFittingPattern = false;
    for (const pattern of expectation.patterns) {
      if (isCredentialFittingPattern(cred, pattern)) {
        if (pattern.constraint) {
          const res = evaluateConstraint(
            pattern.constraint,
            cred,
            credDict,
            VP,
          );
          if (res) {
            patternList.push(pattern);
            oneFittingPattern = true;
            break;
          }
        } else {
          patternList.push(pattern);
          oneFittingPattern = true;
          break;
        }
      }
    }
    if (!oneFittingPattern) {
      return [];
    }
  }
  return patternList;
};

const evaluateConstraint = (
  constraint: VcConstraint,
  cred: any,
  credDict: any,
  VP: any,
): boolean => {
  var a = undefined,
    b = undefined;
  switch (constraint.op) {
    case "equals":
    case "equalsDID":
    case "startsWith":
    case "endsWith":
    case "matches":
      a = resolveValue(constraint.a as string, cred, credDict, VP);
      b = resolveValue(constraint.b as string, cred, credDict, VP);
      if (!(a && b)) {
        return false;
      }
  }

  a = a as string;
  b = b as string;

  switch (constraint.op) {
    case "equals":
      return a === b;
    case "equalsDID":
      return equalsDID(a, b);
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
): string | undefined => {
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
    if (nodes.length > 1) {
      throw Error("JSON Paths in constraints must be single-valued");
    } else if (nodes.length === 0) {
      return undefined;
    }
    return nodes[0].value;
  }

  return expression;
};

const equalsDID = (a: string, b: string) => {
  const whiteList = ["key", "web", "pkh"];
  if (!whiteList.includes(a.split(":")[1])) {
    return false;
  }
  if (!whiteList.includes(b.split(":")[1])) {
    return false;
  }
  const stripDID = (s: string) => {
    s = s.split(":").slice(2).join(":");
    if (s.includes("#")) {
      return s.split("#")[0];
    }
    return s;
  };
  return stripDID(a) == stripDID(b);
};

// only extraction, no checks
const extractClaimsFromVC = (VC: any, pattern: CredentialPattern) => {
  const extractedClaims = {
    tokenId: {},
    tokenAccess: {},
  };

  for (const claim of pattern.claims) {
    const nodes = jp.nodes(VC, claim.claimPath);
    if (nodes.length === 0) continue;

    let newPath = claim.newPath;
    let value: any;

    if (nodes.length > 1) {
      if (!newPath) {
        throw Error(
          "New path not defined for multi-valued claim: " + claim.claimPath,
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

  return extractedClaims;
};
