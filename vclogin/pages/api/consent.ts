import type { NextApiRequest, NextApiResponse } from "next";
import { hydraAdmin } from "@/config/ory";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  try {
    const { method } = req;
    if (method === "GET") {
      console.log("CONSENT API GET");

      const challenge = req.query["consent_challenge"];

      hydraAdmin
        .adminGetOAuth2ConsentRequest(challenge)
        // This will be called if the HTTP request was successful
        .then(({ data: body }) => {
          return hydraAdmin
            .adminAcceptOAuth2ConsentRequest(challenge, {
              // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
              // are requested accidentally.
              grant_scope: body.requested_scopee,

              session: {},

              // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
              grant_access_token_audience: body.requested_access_token_audience,

              // This tells hydra to remember this consent request and allow the same client to request the same
              // scopes from the same user, without showing the UI, in the future.
              remember: Boolean(false),

              // When this "remember" sesion expires, in seconds. Set this to 0 so it will never expire.
              remember_for: 3600,
            })
            .then(({ data: body }) => {
              // All we need to do now is to redirect the user back to hydra!
              res.redirect(String(body.redirect_to)).end();
            });
        })
        .catch((_) => res.status(500).end());
    } else {
      res.status(500).end();
    }
  } catch (e) {
    res.status(500).end();
  }
}

export const config = { api: { bodyParser: false } };
