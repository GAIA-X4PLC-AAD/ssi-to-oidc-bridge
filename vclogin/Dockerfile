FROM node:21-alpine3.18

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY . /usr/src/app

RUN pnpm run build

ENTRYPOINT pnpm run start

EXPOSE 3000
