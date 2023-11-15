/*
 * Copyright (C) 2023, Software Engineering for Business Information Systems (sebis) <matthes@tum.de>
 * SPDX-License-Identifier: Apache-2.0
 */
import { DAppClient, NetworkType } from "@airgap/beacon-sdk";

const rpcUrl = process.env.NEXT_PUBLIC_TEZOS_RPC_URL as string;

const globalForWallet = global as unknown as {
  dAppClient: DAppClient | undefined;
};

function isServer() {
  if (typeof window === "undefined") return true;
  return false;
}

export const dAppClient =
  globalForWallet.dAppClient ??
  (isServer()
    ? undefined
    : new DAppClient({
        name: "GX Credentials",
        preferredNetwork: NetworkType.GHOSTNET,
      }));

globalForWallet.dAppClient = dAppClient;

export function requestRequiredPermissions() {
  return dAppClient!.requestPermissions({
    network: {
      type: NetworkType.GHOSTNET,
      rpcUrl: rpcUrl,
    },
  });
}
