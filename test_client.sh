#!/bin/bash
client=$(docker run --rm -it \
    --network ory-hydra-net \
    oryd/hydra:v2.2.0 \
    create client --skip-tls-verify \
    --name testclient \
    --secret some-secret \
    --grant-type authorization_code \
    --response-type token,code,id_token \
    --scope openid,student \
    --redirect-uri http://localhost:3000/api/auth/callback/oidc \
    -e http://hydra:4445 \
    --token-endpoint-auth-method client_secret_post \
    --format json )

echo $client

client_id=$(echo $client | jq -r '.client_id')
scope=$(echo $client | jq -r '.scope')
generated_policies="./vclogin/__generated__/policies"
generated_inputDescriptors="./vclogin/__generated__/inputDescriptors"

mkdir -p "$generated_policies"
mkdir -p "$generated_inputDescriptors"

for value in $scope; do
    if [ "$value" == "openid" ]; then
        filename="${generated_policies}/main.json"
        echo "This is your main policy for initial login. $filename"
    else
        filename="${generated_policies}/${value}.json"
        echo "This is your policy for $value scope. $filename"
    fi
    echo "Generating file: $filename"
    touch "$filename"
done

for value in $scope; do
    if [ "$value" == "openid" ]; then
        filename="${generated_inputDescriptors}/main.json"
        echo "This is your main input descriptor for initial login. $filename"
    else
        filename="${generated_inputDescriptors}/${value}.json"
        echo "This is your input descriptor for $value scope. $filename"
    fi
    echo "Generating file: $filename"
    touch "$filename"
done

docker run --rm -it \
    --network ory-hydra-net \
    -p 9010:9010 \
    oryd/hydra:v2.2.0 \
    perform authorization-code --skip-tls-verify \
    --port 9010 \
    --client-id $client_id \
    --client-secret some-secret \
    --redirect http://localhost:3000/api/auth/callback/oidc \
    --scope openid,student \
    --auth-url http://localhost:5004/oauth2/auth \
    --token-url http://localhost:5004/oauth2/token \
    -e http://hydra:4444
