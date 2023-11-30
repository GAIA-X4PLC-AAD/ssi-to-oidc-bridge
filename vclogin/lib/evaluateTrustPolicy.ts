import { promises as fs } from "fs";

var configuredPolicy: any | undefined = undefined;
fs.readFile(process.env.TRUST_POLICY as string, "utf8").then((file) => {
  configuredPolicy = JSON.parse(file);
});

export const isTrustedPresentation = (VP: any, policy?: Array<any>) => {
  if (!policy && configuredPolicy === undefined) return false;

  var usedPolicy = policy ? policy : configuredPolicy;

  var creds = VP.verifiableCredential;
  var credArr: Array<any>;
  if (!Array.isArray(creds)) {
    credArr = [creds];
  } else {
    credArr = creds;
  }

  for (let cred of credArr) {
    let iss = cred.issuer;
    let issPolicy = usedPolicy.find((p: any) => p.issuer === iss);
    if (!issPolicy) {
      issPolicy = usedPolicy.find((p: any) => p.issuer === "*");
      if (!issPolicy) {
        // console.log("UNTRUSTED: no policy for issuer: " + iss);
        return false;
      }
    }

    let credType: Array<string> = cred.type;
    if (!credType.includes("VerifiableCredential")) {
      return false;
    }
    for (let i = 0; i < credType.length; i++) {
      let t = credType[i];
      if (t === "VerifiableCredential") continue;
      if (!issPolicy.types.includes(t) && !issPolicy.types.includes("*")) {
        // console.log("UNTRUSTED: no policy for type: " + t + " in issuer: " + iss,);
        return false;
      }
    }
  }

  return true;
};
