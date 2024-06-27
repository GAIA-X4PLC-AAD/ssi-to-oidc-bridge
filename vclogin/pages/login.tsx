/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

import { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useQRCode } from "next-qrcode";
import { useEffect } from "react";
import { keyToDID } from "@spruceid/didkit-wasm-node";
import { redisGet, redisSet } from "@/config/redis";
import parser from "ua-parser-js";

export default function Login(props: any) {
  const router = useRouter();
  const { Canvas } = useQRCode();
  const uaparser = new parser.UAParser();
  const agent = uaparser.getDevice();
  const agentIsMobile = agent.type === "mobile" || agent.type === "tablet";

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
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col place-items-center">
        <div className="flex flex-col place-items-center overflow-hidden bg-gxblue pt-8 px-8 rounded-t-3xl min-w-max">
          <div>
            <p className="text-white font-semibold">
              You are signing in via the
            </p>
            <h1 id="gx-text" className="text-6xl font-bold pb-4 text-white">
              SSI-to-OIDC Bridge
            </h1>
          </div>
        </div>
        <div className="flex flex-col bg-gxblue aspect-square w-full pb-14 px-14 rounded-b-3xl min-w-fit">
          <h2 className="text-white place-self-center">
            {!agentIsMobile
              ? "Scan the code to sign in!"
              : "Click the link to your wallet!"}
          </h2>
          <div className="grid grid-cols-1 flex-grow place-items-center bg-white rounded-2xl aspect-square p-4 min-w-fit">
            {!agentIsMobile ? (
              <Canvas
                text={getWalletUrl()}
                options={{
                  errorCorrectionLevel: "M",
                  margin: 3,
                  scale: 3,
                  width: 300,
                  color: {
                    dark: "#000000FF",
                    light: "#FFFFFFFF",
                  },
                }}
              />
            ) : (
              <a
                href={getWalletUrl()}
                className="text-gxblue text-2xl border-gxblue border-solid border-4 rounded-full p-4"
              >
                Authenticate
              </a>
            )}
          </div>
        </div>
        <div className="text-sm pt-2">
          <a href="https://wwwmatthes.in.tum.de/pages/t5ma0jrv6q7k/sebis-Public-Website-Home">
            Developed by sebis @ TUM
          </a>
        </div>
      </div>

      <div className="mb-32">&nbsp;</div>
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

    let loginId = await redisGet("" + loginChallenge);
    if (!loginId) {
      loginId = crypto.randomUUID();
      const MAX_AGE = 60 * 5; // 5 minutes
      redisSet("" + loginChallenge, "" + loginId, MAX_AGE);
      redisSet("" + loginId, "" + loginChallenge, MAX_AGE);
    }

    const redirect = await redisGet("redirect" + loginId);

    if (redirect) {
      return {
        redirect: {
          destination: redirect,
          permanent: false,
        },
      };
    }

    const did = keyToDID("key", process.env.DID_KEY_JWK!);

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
