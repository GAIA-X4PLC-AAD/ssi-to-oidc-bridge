FROM node:21-alpine3.18

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm i

COPY . /usr/src/app

RUN npm run build

ENTRYPOINT npm run start

EXPOSE 3000