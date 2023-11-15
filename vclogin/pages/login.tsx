/*
 * Copyright (C) 2023, Software Engineering for Business Information Systems (sebis) <matthes@tum.de>
 * SPDX-License-Identifier: Apache-2.0
 */
import { useSearchParams } from "next/navigation";
import { requestRequiredPermissions, dAppClient } from "../config/wallet";
import { SigningType } from "@airgap/beacon-sdk";
import { Redis } from "ioredis";
import { NextPageContext } from "next";
import { useRouter } from "next/router";

export default function Login() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const refreshData = () => {
    return router.replace(router.asPath);
  }

  const requestCredentialFromWallet = async () => {
    const signature = await dAppClient!.requestSignPayload({
      signingType: SigningType.RAW,
      payload:
        "Show your GX Credential! #" +
        process.env.NEXT_PUBLIC_INTERNET_URL +
        "/api/presentCredential?login_challenge=" +
        searchParams.get("login_challenge"),
    });
  };

  const handleLogin = async () => {
    try {
      const activeAccount = await dAppClient?.getActiveAccount();
      let activeAddress;
      let activePk;
      if (activeAccount) {
        console.log("Already connected:", activeAccount.address);
        activeAddress = activeAccount.address;
        activePk = activeAccount.publicKey;
      } else {
        const permissions = await requestRequiredPermissions();
        console.log("New connection:", permissions.address);
        activeAddress = permissions.address;
        activePk = permissions.publicKey;
      }

      requestCredentialFromWallet();

      const timer = setInterval(() => {
        refreshData();
      }, 4000);
    } catch (error) {
      window.alert(error);
    }
  };

  const clearWalletConnection = () => {
    dAppClient!.clearActiveAccount();
  };

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
          <button
            id="login-button"
            className="text-lg w-2/4 hover:bg-gray-100 font-semibold py-2 px-2 border border-gray-500 hover:border-transparent rounded"
            onClick={handleLogin}
          >
            Connect Wallet and Login
          </button>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:grid-cols-4 lg:text-left">
        <button
            id="login-button"
            className="text-sm w-2/4 hover:bg-gray-100 font-semibold py-2 px-2 border border-gray-500 hover:border-transparent rounded"
            onClick={clearWalletConnection}
          >
            Disconnect Wallet
          </button>
        &nbsp;
      </div>
    </main>
  );
}

export async function getServerSideProps(context: NextPageContext) {
  try {
    console.log("Connecting to redis at: "+process.env.REDIS_HOST+":" +process.env.REDIS_PORT)
    const redis = new Redis(parseInt(process.env.REDIS_PORT!),process.env.REDIS_HOST!);

    const challenge = context.query["login_challenge"];
    console.log("Challenge: "+context.query["login_challenge"]);

    const redirect = await redis.get(""+challenge);
    console.log("Redirect: "+redirect);

    if(redirect){
      return {
        redirect: {
          destination: redirect,
          permanent: false,
        },
      };
    }

    return {
      props: {},
    };
  } catch (error) {
    return {
      redirect: {
        destination: "/common/error",
        permanent: false,
      },
    };
  }
}
