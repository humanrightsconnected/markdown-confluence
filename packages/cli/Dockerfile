FROM ghcr.io/puppeteer/puppeteer:24.26.0@sha256:ed1bd8ac8c3336967f28e425d12228191872bc842fc93bf5db5d8b99ab171e4d

COPY ./dist /app

ENV NODE_OPTIONS=--enable-source-maps PUPPETEER_CACHE_DIR="/home/pptruser/.cache/puppeteer"

WORKDIR "/content"

CMD ["node", "/app/index.js"]
