/*
 * Copyright (C) 2023, Software Engineering for Business Information Systems (sebis) <matthes@tum.de>
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  verifyCredential,
  verifyPresentation,
} from "@spruceid/didkit-wasm-node";

export const verifyAuthenticationPresentation = async (VP: any) => {
  try {
    let status = false;
    if (VP?.verifiableCredential) {
      const VC = VP.verifiableCredential;
      if (VC) {
        status = await verifyPresentationHelper(VC, VP);
      } else {
        const errorMessage = "Unable to find a VC in the VP";
        console.error(errorMessage);
      }
    } else {
      // No VCs in VP
      const errorMessage = "Unable to detect verifiable credentials in the VP";
      console.error(errorMessage);
    }
    return status;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const verifyPresentationHelper = async (VC: any, VP: any): Promise<boolean> => {
  // TezosAssociatedAddress VCs are signed with the Tezos key, but the VP is signed with a wallet did:key
  // we need to check that the wallet did:key matches the key confirmed with the Tezos key signature
  if (VP?.holder && VP?.holder === VC?.credentialSubject?.id) {
    // Verify the signature on the VC
    const verifyOptionsString = "{}";
    const verifyResult = JSON.parse(
      await verifyCredential(JSON.stringify(VC), verifyOptionsString),
    );
    // If credential verification is successful, verify the presentation
    if (verifyResult?.errors?.length === 0) {
      const res = JSON.parse(
        await verifyPresentation(JSON.stringify(VP), verifyOptionsString),
      );
      // If verification is successful
      if (res.errors.length === 0) {
        return true;
      } else {
        const errorMessage = `Unable to verify presentation: ${res.errors.join(
          ", ",
        )}`;
        console.error(errorMessage);
      }
    } else {
      const errorMessage = `Unable to verify credential: ${verifyResult.errors.join(
        ", ",
      )}`;
      console.error(errorMessage);
    }
  } else {
    const errorMessage = "The credential subject does not match the VP holder.";
    console.error(errorMessage);
  }
  return false;
};
