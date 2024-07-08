/**
 * Copyright 2024 Software Engineering for Business Information Systems (sebis) <matthes@tum.de> .
 * SPDX-License-Identifier: MIT
 */

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-5xl items-center justify-between lg:flex"></div>

      <div className="flex flex-col place-items-center overflow-hidden">
        <div>
          <h1 id="gx-text" className="text-6xl font-bold text-gxblue pb-2">
            SSI-to-OIDC Bridge
          </h1>
        </div>
        <div className="w-full align-center justify-center inline-block font-semibold">
          This page is an info page without function. It is part of an
          application that supports VC-based logins for other services. If you
          want to know more, ask your administrator or visit the project page on{" "}
          <a
            href="https://github.com/GAIA-X4PLC-AAD/ssi-to-oidc-bridge"
            className="text-gxpurple"
          >
            GitHub
          </a>
          .
        </div>
      </div>

      <div className="text-sm pt-2">
        <a href="https://wwwmatthes.in.tum.de/pages/t5ma0jrv6q7k/sebis-Public-Website-Home">
          Developed by sebis @ TUM
        </a>
      </div>
    </main>
  );
}
