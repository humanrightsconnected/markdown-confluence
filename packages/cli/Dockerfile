FROM ghcr.io/puppeteer/puppeteer:24.26.1@sha256:f61e044d6cb79f49104c59f8e34423b07e4c78d7350e08bbd5d51bc63dfc2a4d

COPY ./dist /app

ENV NODE_OPTIONS=--enable-source-maps PUPPETEER_CACHE_DIR="/home/pptruser/.cache/puppeteer"

WORKDIR "/content"

CMD ["node", "/app/index.js"]
