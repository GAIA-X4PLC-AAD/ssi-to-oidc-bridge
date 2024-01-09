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
    if (!VP?.verifiableCredential) {
      console.error("Unable to detect verifiable credentials in the VP");
      return false;
    }

    const creds = Array.isArray(VP.verifiableCredential)
      ? VP.verifiableCredential
      : [VP.verifiableCredential];

    for (const cred of creds) {
      if (!(await verifyPresentationHelper(cred, VP))) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const verifyPresentationHelper = async (VC: any, VP: any): Promise<boolean> => {
  if (
    VP.holder &&
    VP.holder === VC.credentialSubject.id &&
    VP.proof.verificationMethod.split("#")[0] === VP.holder
  ) {
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
