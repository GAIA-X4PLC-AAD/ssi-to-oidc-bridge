/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { Redis } from "ioredis";
import { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useQRCode } from "next-qrcode";
import { useEffect } from "react";
import { keyToDID } from "@spruceid/didkit-wasm-node";
import { logger } from "@/config/logger";

export default function Login(props: any) {
  const router = useRouter();
  const { Canvas } = useQRCode();

  const refreshData = () => {
    return router.replace(router.asPath);
  };

  const getWalletUrl = () => {
    return (
      "openid-vc://?client_id=" +
      props.clientId +
      "&request_uri=" +
      encodeURIComponent(
        props.externalUrl + "/api/presentCredential?login_id=" + props.loginId,
      )
    );
  };

  useEffect(() => {
    const id = setInterval(() => {
      refreshData();
    }, 3000);
    return () => clearInterval(id);
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col place-items-center overflow-hidden">
        <div>
          <h4
            id="gx-text"
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 pb-4 mt-2"
          >
            Sign-in with SSI-to-OIDC Bridge
          </h4>
        </div>

        <div className="w-full flex align-center justify-center">
          <Canvas
            text={getWalletUrl()}
            options={{
              errorCorrectionLevel: "M",
              margin: 3,
              scale: 4,
              width: 300,
              color: {
                dark: "#000000FF",
                light: "#FFFFFFFF",
              },
            }}
          />
        </div>

        <div className="w-full flex align-center justify-center mt-2 text-sm font-light text-blue-700">
          Scan QR Code with SSI Wallet
        </div>
      </div>
    </main>
  );
}

export async function getServerSideProps(context: NextPageContext) {
  try {
    const loginChallenge = context.query["login_challenge"];
    if (loginChallenge === undefined) {
      return {
        redirect: {
          destination: "/common/error",
          permanent: false,
        },
      };
    }

    const redis = new Redis(
      parseInt(process.env.REDIS_PORT!),
      process.env.REDIS_HOST!,
    );

    let loginId = await redis.get("" + loginChallenge);
    if (!loginId) {
      loginId = crypto.randomUUID();
      const MAX_AGE = 60 * 5; // 5 minutes
      const EXPIRY_MS = "EX"; // seconds
      await redis.set("" + loginChallenge, "" + loginId, EXPIRY_MS, MAX_AGE);
      await redis.set("" + loginId, "" + loginChallenge, EXPIRY_MS, MAX_AGE);
    }

    const redirect = await redis.get("redirect" + loginId);

    if (redirect) {
      return {
        redirect: {
          destination: redirect,
          permanent: false,
        },
      };
    }

    const did = await keyToDID("key", process.env.DID_KEY_JWK!);
    logger.debug("DID: " + did);

    return {
      props: { loginId, externalUrl: process.env.EXTERNAL_URL, clientId: did },
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
