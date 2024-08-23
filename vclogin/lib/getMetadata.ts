/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

export const getMetadata = (redirect_uris: string[]) => {
  const metadata = {
    scopes_supported: ["openid"],
    response_types_supported: ["id_token", "vp_token"],
    response_modes_supported: ["query"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: [
      "ES256",
      "ES256k",
      "EdDSA",
      "RS256",
    ],
    request_object_signing_alg_values_supported: [
      "ES256",
      "ES256K",
      "EdDSA",
      "RS256",
    ],
    vp_formats: {
      jwt_vp: {
        alg_values_supported: ["ES256", "ES256K", "EdDSA", "RS256"],
      },
      jwt_vc: {
        alg_values_supported: ["ES256", "ES256K", "EdDSA", "RS256"],
      },
    },
    subject_syntax_types_supported: [
      "did:key",
      "did:ebsi",
      "did:tz",
      "did:pkh",
      "did:key",
      "did:ethr",
    ],
    subject_syntax_types_discriminations: [
      "did:key:jwk_jcs-pub",
      "did:ebsi:v1",
    ],
    subject_trust_frameworks_supported: ["ebsi"],
    id_token_types_supported: ["subject_signed_id_token"],
    client_name: "VP Login Service",
    request_uri_parameter_supported: true,
    request_parameter_supported: false,
    redirect_uris,
  };
  return metadata;
};
