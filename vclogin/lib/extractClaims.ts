export const extractClaims = (VP: any) => {
  const creds = Array.isArray(VP.verifiableCredential)
    ? VP.verifiableCredential
    : [VP.verifiableCredential];
  const vcClaims = creds.map(extractClaimsFromVC);
  const claims = vcClaims.reduce(
    (acc: any, vc: any) => Object.assign(acc, vc),
    {},
  );
  return claims;
};

const extractClaimsFromVC = (VC: any) => {
  return VC.credentialSubject;
};
