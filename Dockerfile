FROM node:22-alpine3.20

WORKDIR /app

COPY ["package.json", "pnpm-lock.yaml", "./"]

RUN apk add --no-cache git
# aaa libgl1 libnss3 libssl3 libxcursor1 libgtk2.0-0 xvfb

RUN npm install --no-save pnpm

RUN npx pnpm install

COPY . .

RUN npx pnpm run build
RUN npx pnpm prune --prod

ENV NODE_ENV=production

ENTRYPOINT [ "node", "dist/index.js" ]