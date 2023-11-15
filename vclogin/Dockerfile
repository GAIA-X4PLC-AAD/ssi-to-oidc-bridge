FROM node:20-alpine3.18

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm i --silent

COPY . /usr/src/app

ENTRYPOINT npm run dev

EXPOSE 3000