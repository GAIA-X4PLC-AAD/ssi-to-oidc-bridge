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
