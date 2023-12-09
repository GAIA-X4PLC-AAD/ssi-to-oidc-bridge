import { promises as fs } from "fs";
import jp from "jsonpath";

type ClaimEntry = {
  claimPath: string;
  newPath?: string;
  token?: string;
  required?: boolean;
};
type CredentialPattern = {
  issuer: string;
  claims: ClaimEntry[];
};
type ExpectedCredential = {
  credentialID: string;
  patterns: CredentialPattern[];
};
type LoginPolicy = ExpectedCredential[];

var configuredPolicy: LoginPolicy | undefined = undefined;
fs.readFile(process.env.TRUST_POLICY as string, "utf8").then((file) => {
  configuredPolicy = JSON.parse(file);
});

export const isTrustedPresentation = (VP: any, policy?: LoginPolicy) => {
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
  console.log("cred:", cred);
  console.log("pattern:", pattern);

  if (cred.issuer !== pattern.issuer && pattern.issuer !== "*") {
    console.log("Issuer does not match pattern");
    return false;
  }

  for (const claim of pattern.claims) {
    if (claim.required && jp.paths(cred, claim.claimPath).length === 0) {
      console.log(`Required claim '${claim.claimPath}' not found in credential`);
      return false;
    }
  }

  console.log("Credential fits pattern");
  return true;
};

export const exportedForTesting = {
  hasUniquePath,
};
