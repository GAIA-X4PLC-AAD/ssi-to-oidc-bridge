import { CredentialPattern, LoginPolicy } from "@/types/LoginPolicy";
import jp from "jsonpath";
import { getConfiguredLoginPolicy } from "@/config/loginPolicy";

export const isTrustedPresentation = (VP: any, policy?: LoginPolicy) => {
  var configuredPolicy = getConfiguredLoginPolicy();
  if (!policy && configuredPolicy === undefined) return false;

  var usedPolicy = policy ? policy : configuredPolicy!;

  var creds = VP.verifiableCredential;
  var credArr: Array<any>;
  if (!Array.isArray(creds)) {
    credArr = [creds];
  } else {
    credArr = creds;
  }

  // collect all credentials that fit an expected credential
  var patternFits = [];
  for (let expectation of usedPolicy) {
    let fittingCreds = [];
    for (let cred of credArr) {
      if (isCredentialFittingPatternList(cred, expectation.patterns)) {
        fittingCreds.push(cred);
      }
    }
    patternFits.push(fittingCreds);
  }

  return hasUniquePath(patternFits, []);
};

const hasUniquePath = (patternFits: any[][], usedCreds: any[]): boolean => {
  if (patternFits.length === 1) return patternFits[0].length > 0;

  for (let cred of patternFits[0]) {
    if (!usedCreds.includes(cred)) {
      usedCreds.push(cred);
      let newPatternFits = patternFits.slice(1);
      if (hasUniquePath(newPatternFits, usedCreds)) {
        return true;
      }
      usedCreds.pop();
    }
  }
  return false;
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

export const exportedForTesting = {
  hasUniquePath,
};
