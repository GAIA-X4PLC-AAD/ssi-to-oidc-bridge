#!/bin/bash

URL="http://hydra:4444/userinfo"

# wait until hydra is up
while true; do
  # Use wget to check if there's any HTTP response, including errors
  STATUS=$(wget --server-response --spider "$URL" 2>&1 | awk '/HTTP\// {print $2}' | tail -n 1)

  if [ -n "$STATUS" ]; then
    echo "Success: Received HTTP status code $STATUS from $URL!"
    break
  else
    echo "Waiting for any HTTP response from $URL..."
    sleep 5 # Wait for 5 seconds before checking again
  fi
done

client=$(hydra create client --skip-tls-verify \
  --name testclient \
  --secret some-secret \
  --grant-type authorization_code \
  --response-type token,code,id_token \
  --scope openid \
  --redirect-uri "http://localhost:9010/callback" \
  -e http://hydra:4445 \
  --format json)

echo "$client"

client_id=$(echo "$client" | grep -o '"client_id":"[^"]*"' | sed 's/"client_id":"//;s/"//')

hydra perform authorization-code --skip-tls-verify \
  --port 9010 \
  --client-id "$client_id" \
  --client-secret some-secret \
  --redirect "http://localhost:9010/callback" \
  --scope openid \
  --auth-url http://localhost:5004/oauth2/auth \
  --token-url http://hydra:4444/oauth2/token \
  -e http://hydra:4444
