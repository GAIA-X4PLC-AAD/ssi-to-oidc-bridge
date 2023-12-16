import { LoginPolicy, ClaimEntry } from "@/types/LoginPolicy";
import jp from "jsonpath";
import { getConfiguredLoginPolicy } from "@/config/loginPolicy";

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

const extractClaimsFromVC = (VC: any, policy: LoginPolicy) => {
  for (let expectation of policy) {
    for (let pattern of expectation.patterns) {
      if (pattern.issuer === VC.issuer || pattern.issuer === "*") {
        var containsAllRequired =
          pattern.claims.filter(
            (claim: ClaimEntry) =>
              claim.required && jp.paths(VC, claim.claimPath).length === 1,
          ).length > 0 ||
          pattern.claims.filter((claim: ClaimEntry) => claim.required)
            .length === 0;

        if (!containsAllRequired) {
          continue;
        }

        let extractedClaims = {
          tokenId: {},
          tokenAccess: {},
        };
        for (let claim of pattern.claims) {
          var nodes = jp.nodes(VC, claim.claimPath);
          var newPath = claim.newPath ? claim.newPath : claim.claimPath;
          var value: any;
          if (nodes.length > 1) {
            value = nodes
              .map((node: any) => {
                var obj: any = {};
                obj[node.path[node.path.length - 1]] = node.value;
                return obj;
              })
              .reduce((acc: any, vals: any) => Object.assign(acc, vals), {});
          } else {
            value = nodes[0].value;
          }
          if (claim.token && claim.token === "id_token") {
            jp.value(extractedClaims.tokenId, newPath, value);
          } else {
            jp.value(extractedClaims.tokenAccess, newPath, value);
          }
        }
        return extractedClaims;
      }
    }
  }
  return {};
};
