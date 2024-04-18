/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { isTrustedPresentation } from "@/lib/extractClaims";
import { useState } from "react";

const policy = [
  {
    credentialId: "1",
    patterns: [
      {
        issuer: "did:web:app.altme.io:issuer",
        claims: [
          {
            claimPath: "$.credentialSubject.email",
            token: "id_token",
          },
        ],
        constraint: {
          op: "equals",
          a: "$VP.proof.verificationMethod",
          b: "$1.credentialSubject.id",
        },
      },
    ],
  },
  {
    credentialId: "2",
    patterns: [
      {
        issuer: "did:tz:tz1NyjrTUNxDpPaqNZ84ipGELAcTWYg6s5Du",
        claims: [
          {
            claimPath: "$.credentialSubject.email",
            token: "id_token",
          },
        ],
        constraint: {
          op: "equals",
          a: "$1.credentialSubject.email",
          b: "$2.credentialSubject.email",
        },
      },
    ],
  },
  {
    credentialId: "3",
    patterns: [
      {
        issuer: "did:web:app.altme.io:issuer",
        claims: [
          {
            claimPath: "$.credentialSubject.email",
            token: "id_token",
          },
        ],
        constraint: {
          op: "equals",
          a: "$3.credentialSubject.name",
          b: "$2.credentialSubject.name",
        },
      },
    ],
  },
];

const vp = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  id: "urn:uuid:89581491-c9d6-47d2-bd4b-e606fe6acd70",
  type: ["VerifiablePresentation"],
  verifiableCredential: [
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        {
          EmailPass: {
            "@context": {
              "@protected": true,
              "@version": 1.1,
              email: "schema:email",
              id: "@id",
              issuedBy: {
                "@context": {
                  "@protected": true,
                  "@version": 1.1,
                  logo: {
                    "@id": "schema:image",
                    "@type": "@id",
                  },
                  name: "schema:name",
                },
                "@id": "schema:issuedBy",
              },
              schema: "https://schema.org/",
              type: "@type",
            },
            "@id": "https://github.com/TalaoDAO/context#emailpass",
          },
        },
      ],
      id: "urn:uuid:c2ceaca0-8e9b-11ee-9aa4-0a5bad1dad01",
      type: ["VerifiableCredential", "EmailPass"],
      credentialSubject: {
        id: "did:key:z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd",
        email: "felix.hoops@tum.de",
        type: "EmailPass",
        issuedBy: {
          name: "Altme",
        },
      },
      issuer: "did:web:app.altme.io:issuer",
      issuanceDate: "2023-11-29T09:43:33Z",
      proof: {
        type: "Ed25519Signature2018",
        proofPurpose: "assertionMethod",
        verificationMethod: "did:web:app.altme.io:issuer#key-1",
        created: "2023-11-29T09:43:33.482Z",
        jws: "eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..wl9s4OXCG5vV_sDvxn0E8DmHqQ482e2BlKy-sRsIN9WSwO0ZTU3O75wnEl0PtAcwIFPz_3VIlpz9hjJcRUqABA",
      },
      expirationDate: "2024-11-28T09:43:33.446349Z",
    },
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        {
          StatusList2021Entry: {
            "@context": {
              "@protected": true,
              id: "@id",
              statusListCredential: {
                "@id": "https://w3id.org/vc/status-list#statusListCredential",
                "@type": "@id",
              },
              statusListIndex:
                "https://w3id.org/vc/status-list#statusListIndex",
              statusPurpose: "https://w3id.org/vc/status-list#statusPurpose",
              type: "@type",
            },
            "@id": "https://w3id.org/vc/status-list#StatusList2021Entry",
          },
          EmployeeCredential: {
            "@context": {
              "@protected": true,
              "@version": 1.1,
              email: "schema:email",
              ethereumAddress: "schema:identifier",
              hasCountry: "schema:addressCountry",
              hasJurisdiction: "schema:addressCountry",
              hasLegallyBindingName: "schema:legalName",
              hasRegistrationNumber: "schema:identifier",
              hash: "schema:sha256",
              id: "@id",
              leiCode: "schema:leiCode",
              name: "schema:name",
              parentOrganisation: "schema:legalName",
              schema: "https://schema.org/",
              subOrganisation: "schema:legalName",
              surname: "schema:givenName",
              title: "schema:jobTitle",
              type: "@type",
            },
            "@id": "urn:employeecredential",
          },
        },
      ],
      id: "urn:uuid:2eb827bc-8ecc-11ee-9722-0a1628958560",
      type: ["VerifiableCredential", "EmployeeCredential"],
      credentialSubject: {
        id: "did:key:z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd",
        hash: "9ecf754ffdad0c6de238f60728a90511780b2f7dbe2f0ea015115515f3f389cd",
        leiCode: "391200FJBNU0YW987L26",
        hasLegallyBindingName: "deltaDAO AG",
        ethereumAddress: "0x4C84a36fCDb7Bc750294A7f3B5ad5CA8F74C4A52",
        email: "felix.hoops@tum.de",
        hasRegistrationNumber: "DEK1101R.HRB170364",
        name: "Test",
        hasCountry: "GER",
        type: "EmployeeCredential",
        title: "CEO",
        hasJurisdiction: "GER",
        surname: "Surname",
      },
      issuer: "did:tz:tz1NyjrTUNxDpPaqNZ84ipGELAcTWYg6s5Du",
      issuanceDate: "2023-11-29T15:30:10.335704Z",
      proof: {
        "@context": {
          Ed25519BLAKE2BDigestSize20Base58CheckEncodedSignature2021: {
            "@context": {
              "@protected": true,
              "@version": 1.1,
              challenge: "https://w3id.org/security#challenge",
              created: {
                "@id": "http://purl.org/dc/terms/created",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
              },
              domain: "https://w3id.org/security#domain",
              expires: {
                "@id": "https://w3id.org/security#expiration",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
              },
              id: "@id",
              jws: "https://w3id.org/security#jws",
              nonce: "https://w3id.org/security#nonce",
              proofPurpose: {
                "@context": {
                  "@protected": true,
                  "@version": 1.1,
                  assertionMethod: {
                    "@container": "@set",
                    "@id": "https://w3id.org/security#assertionMethod",
                    "@type": "@id",
                  },
                  authentication: {
                    "@container": "@set",
                    "@id": "https://w3id.org/security#authenticationMethod",
                    "@type": "@id",
                  },
                  id: "@id",
                  type: "@type",
                },
                "@id": "https://w3id.org/security#proofPurpose",
                "@type": "@vocab",
              },
              publicKeyJwk: {
                "@id": "https://w3id.org/security#publicKeyJwk",
                "@type": "@json",
              },
              type: "@type",
              verificationMethod: {
                "@id": "https://w3id.org/security#verificationMethod",
                "@type": "@id",
              },
            },
            "@id":
              "https://w3id.org/security#Ed25519BLAKE2BDigestSize20Base58CheckEncodedSignature2021",
          },
          Ed25519PublicKeyBLAKE2BDigestSize20Base58CheckEncoded2021: {
            "@id":
              "https://w3id.org/security#Ed25519PublicKeyBLAKE2BDigestSize20Base58CheckEncoded2021",
          },
          P256BLAKE2BDigestSize20Base58CheckEncodedSignature2021: {
            "@context": {
              "@protected": true,
              "@version": 1.1,
              challenge: "https://w3id.org/security#challenge",
              created: {
                "@id": "http://purl.org/dc/terms/created",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
              },
              domain: "https://w3id.org/security#domain",
              expires: {
                "@id": "https://w3id.org/security#expiration",
                "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
              },
              id: "@id",
              jws: "https://w3id.org/security#jws",
              nonce: "https://w3id.org/security#nonce",
              proofPurpose: {
                "@context": {
                  "@protected": true,
                  "@version": 1.1,
                  assertionMethod: {
                    "@container": "@set",
                    "@id": "https://w3id.org/security#assertionMethod",
                    "@type": "@id",
                  },
                  authentication: {
                    "@container": "@set",
                    "@id": "https://w3id.org/security#authenticationMethod",
                    "@type": "@id",
                  },
                  id: "@id",
                  type: "@type",
                },
                "@id": "https://w3id.org/security#proofPurpose",
                "@type": "@vocab",
              },
              publicKeyJwk: {
                "@id": "https://w3id.org/security#publicKeyJwk",
                "@type": "@json",
              },
              type: "@type",
              verificationMethod: {
                "@id": "https://w3id.org/security#verificationMethod",
                "@type": "@id",
              },
            },
            "@id":
              "https://w3id.org/security#P256BLAKE2BDigestSize20Base58CheckEncodedSignature2021",
          },
          P256PublicKeyBLAKE2BDigestSize20Base58CheckEncoded2021: {
            "@id":
              "https://w3id.org/security#P256PublicKeyBLAKE2BDigestSize20Base58CheckEncoded2021",
          },
        },
        type: "Ed25519BLAKE2BDigestSize20Base58CheckEncodedSignature2021",
        proofPurpose: "assertionMethod",
        verificationMethod:
          "did:tz:tz1NyjrTUNxDpPaqNZ84ipGELAcTWYg6s5Du#blockchainAccountId",
        created: "2023-11-29T15:30:27.583Z",
        jws: "eyJhbGciOiJFZEJsYWtlMmIiLCJjcml0IjpbImI2NCJdLCJiNjQiOmZhbHNlfQ..EHmQL4JQ6RLZVFob3mH_Rlue3Nv9qyeug0ZYtysWJOfC-dJqCphb3li9llmSmazB1vvCFvG5WKTg2ooXpowYCg",
        publicKeyJwk: {
          crv: "Ed25519",
          kty: "OKP",
          x: "FUoLewH4w4-KdaPH2cjZbL--CKYxQRWR05Yd_bIbhQo",
        },
      },
      expirationDate: "2024-11-28T15:30:10.335716Z",
      credentialStatus: {
        id: "https://revocation-registry.abc-federation.dev.gaiax.ovh/api/v1/revocations/credentials/ABC-Federation-revocation#51",
        type: "StatusList2021Entry",
        statusListCredential:
          "https://revocation-registry.abc-federation.dev.gaiax.ovh/api/v1/revocations/credentials/ABC-Federation-revocation",
        statusPurpose: "revocation",
        statusListIndex: "51",
      },
      credentialSchema: {
        id: "https://raw.githubusercontent.com/walt-id/waltid-ssikit-vclib/master/src/test/resources/schemas/ParticipantCredential.json",
        type: "JsonSchemaValidator2018",
      },
      validFrom: "2023-07-20T15:36:41Z",
      issued: "2023-07-20T15:36:41Z",
    },
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        {
          AnotherCredentialType: {
            "@context": {
              "@protected": true,
              "@version": 1.1,
              email: "schema:email",
              id: "@id",
              issuedBy: {
                "@context": {
                  "@protected": true,
                  "@version": 1.1,
                  logo: {
                    "@id": "schema:image",
                    "@type": "@id",
                  },
                  name: "schema:name",
                },
                "@id": "schema:issuedBy",
              },
              schema: "https://schema.org/",
              type: "@type",
            },
            "@id": "https://github.com/TalaoDAO/context#emailpass",
          },
        },
      ],
      id: "urn:uuid:c2ceaca0-8e9b-11ee-9aa4-0a5bax",
      type: ["VerifiableCredential", "AnotherCredentialType"],
      credentialSubject: {
        id: "did:key:z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd",
        name: "Test",
        type: "AnotherCredentialType",
        email: "felix.hoops@tum.de",
      },
      issuer: "did:web:app.altme.io:issuer",
      issuanceDate: "2023-11-29T09:43:33Z",
      proof: {
        type: "Ed25519Signature2018",
        proofPurpose: "assertionMethod",
        verificationMethod: "did:web:app.altme.io:issuer#key-1",
        created: "2023-11-29T09:43:33.482Z",
        jws: "eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..wl9s4OXCG5vV_sDvxn0E8DmHqQ482e2BlKy-sRsIN9WSwO0ZTU3O75wnEl0PtAcwIFPz_3VIlpz9hjJcRUqABA",
      },
      expirationDate: "2024-11-28T09:43:33.446349Z",
    },
  ],
  proof: {
    type: "Ed25519Signature2018",
    proofPurpose: "authentication",
    challenge: "test",
    verificationMethod:
      "did:key:z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd",
    created: "2023-11-29T14:12:48.142Z",
    domain: "https://ec80-2003-ee-af45-6c00-e0d1-7850-acea-8745.ngrok-free.app",
    jws: "eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..cUfNpVhLFOmBIebiJO345ImTzKN0_G9Al2k8dJx7wcYvXCfyfWnxFdCGCi13c2tNj6bA-RbzFmo6qrEaQTxtAw",
  },
  holder: "did:key:z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd",
};

export default function Home() {
  const [isVPValid, setIsVPValid] = useState(false);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p>This is experimental software. Use with caution!</p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://wwwmatthes.in.tum.de/pages/t5ma0jrv6q7k/sebis-Public-Website-Home"
            target="_blank"
            rel="noopener noreferrer"
          >
            By sebis @ TUM
          </a>
        </div>
      </div>

      <div className="flex flex-col place-items-center overflow-hidden">
        <div>
          <h1
            id="gx-text"
            className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 transition duration-500 ease-in-out transform -translate-y-full"
          >
            GX Credentials Bridge
          </h1>
        </div>
        <div className="w-full flex align-center justify-center">
          This page supports VC-based logins.
        </div>
      </div>

      <button
        onClick={() => {
          const res = isTrustedPresentation(vp, policy);
          setIsVPValid(res);
        }}
      >
        Check VP
      </button>
      <div>{isVPValid ? "Valid" : "Invalid"}</div>
      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left">
        {/*TODO add some more informative content here later on*/}
        &nbsp;
      </div>
    </main>
  );
}
