# Gaia-X Credentials Bridge

> [!WARNING]
> This repository is in early development and not feature complete.

## Overview

This bridge allows you to use established OIDC flows to authenticate and authorize users that have W3C Verifiable Credentials. As a contribution to Gaia-X infrastructure, the ultimate goal here is to enable users to use their GX Participant Credential to access systems while making integration simpler through using established SSO protocols.


## Architecture

There are two main components to this project and a lot of additional containers for monitoring and databases. A company (or at least a small consortium) wanting to support SSI in their existing (or new) systems, is expected to run this full setup to avoid introducing a middle man.

### OIDC Provider: Ory Hydra

Hydra is a FOSS and OpenID certified implementation. It should allow any OIDC or OAuth2 client to leverage it as an IdP. For development, it has the advantage of giving us freedom to build a custom login process, as we can specify arbitrary redirects.

### VC Login Service

This custom Next.js web app provides a user frontend for the login process, as well as necessary backend API routes. It handles the wallet connection, the Verifiable Presentaiton exchange, the verification


## Flow

The user starts out on the service website. Redirects (mostly) omit the middle step of returning to the browser for readability. Wallet still uses Beacon Protocol, but should ultimately use OpenID4VP.

```mermaid
sequenceDiagram
	autonumber
	actor User
	participant Browser
	participant Wallet
	participant Site as Web Service
	participant Login as Login Endpoint
	participant OP as OpenID Connect Provider
	User->>Browser: Click "Login"
	Browser->>Site: Login Trigger?
	Site->>OP: Start OAuth2 Flow
	OP->>Login: Redirect to GET /login?login_challenge=<abc>
	Login->>Browser: Render custom login page
	Browser->>User: Ask for VP-based login
	User->>Browser: Click "Connect Wallet"
	Browser->>Browser: Generate Beacon QR Code
	User->>Wallet: Scan QR Code with Wallet
	Wallet->>Browser: Read QR Code and send basic info
	Browser->>Login: Redirect to GET /presentCredential?login_challenge=<abc> via Beacon signing request
	Login->>Wallet: Prompt Wallet for identity VP with challenge
	Wallet->>User: Ask for consent and choice of VC for VP
	User->>Wallet: Chooses one identity VC and confirms
	Wallet->>Wallet: Build and signs VP with challenge
	Wallet->>Login: Send identity VP to POST /presentCredential
	Login->>Login: Verify VP and extract challenge and subject
	Login->>OP: Get login request by challenge
	OP->>Login: Return login request details
	Login->>OP: Accept login request
	OP->>Login: Return redirect url
	Login->>Login: Save redirect url by challenge
	Login->>Wallet: Confirm 200 OK
	loop Success Check
		Browser->>Site: Automatically ask for login by challenge
	end
	Site->>OP: Redirect to saved redirect url
	OP->>Login: Redirect to GET /consent?consent_challenge=<abc>
	Login->>OP: Get consent request by challenge
	OP->>Login: Send requested consent info (user, scopes, ...)
	Login->>OP: Automatically give full consent
	OP->>Login: Return redirect url
	Login->>OP: Redirect to redirect url
	OP->>Site: Redirect with authorization code
	Site->>Browser: Render callback page
	Browser->>OP: Request tokens with authorization code
	OP->>Browser: Access Token (+maybe ID Token)
	Browser->>Site: Get protected service page with access token
```


## Development Roadmap

While the repository already demonstrates a working front-to-back flow, here are some pointers to the main features still missing:
- support for real GX Participant Credentials and their proper verification
- a trusted issuer list and possibly access policies
- OpenID4VP support


## Running it for testing

1. `$ ngrok http 5002` and enter the domain into the compose file for the vclogin
2. `$ docker compose up`
3. `$ ./test_client.sh`
4. Go to `http://localhost:9010`
5. Download Altme Wallet and setup new account
6. Follow the login flow and present your Account Ownership VC generated on Altme startup
7. End up at `http://localhost:9010/callback` with metadata about the login being displayed


## Token Introspection

Look into the access token like this:

```
$ docker run --rm -it \
    --network ory-hydra-net \
    oryd/hydra:v2.2.0 \
    introspect token --skip-tls-verify \
    --format json-pretty \
    -e http://hydra:4445 \
    TOKEN
```

Example result:

```
{
  "active": true,
  "client_id": "92cb2457-a125-4b41-af31-39a739ccdf19",
  "exp": 1699045032,
  "iat": 1699041432,
  "iss": "http://localhost:5004/",
  "nbf": 1699041432,
  "sub": "did:pkh:tz:tz1Nm5krcMJA899MVKDUUJU5N2torXj3UsPQ",
  "token_type": "Bearer",
  "token_use": "access_token"
}
```