# create static files and configs
FROM node:16-slim

WORKDIR /workspace
COPY shared_config.json .
COPY scripts scripts
COPY templates templates
COPY utils utils
COPY servers/nodejs/package.json servers/nodejs/package.json
RUN cd servers/nodejs && npm install
COPY servers/nodejs servers/nodejs

RUN node scripts/create_static_files.js && node scripts/create_px_configs.js

WORKDIR /workspace/servers/nodejs

COPY ../../../ perimeterx-node-express
RUN npm install ./perimeterx-node-express

ARG ENABLE_TEST_ENDPOINTS=true
ARG PX_APP_ID=""
ARG PX_AUTH_TOKEN=""
ARG PX_COOKIE_SECRET=""

ENV ENABLE_TEST_ENDPOINTS=${ENABLE_TEST_ENDPOINTS}
ENV PX_APP_ID=${PX_APP_ID}
ENV PX_AUTH_TOKEN=${PX_AUTH_TOKEN}
ENV PX_COOKIE_SECRET=${PX_COOKIE_SECRET}

EXPOSE 3000
CMD ["node","app.js"]
