FROM node:16-alpine as builder
ARG ENFORCER_NAME

WORKDIR /tmp/sample-sites

COPY shared_config.json .
COPY scripts scripts
COPY utils utils
COPY templates/static_files templates/static_files
COPY servers/${ENFORCER_NAME} servers/${ENFORCER_NAME}

RUN node scripts/create_static_files.js && node scripts/create_px_configs.js

FROM node:16-alpine as origin
ARG ENFORCER_NAME

WORKDIR /app
COPY utils utils

WORKDIR /app/templates/origin
COPY templates/origin/package.json .
RUN npm install
COPY templates/origin/*.js .

WORKDIR /app/servers/${ENFORCER_NAME}
COPY --from=builder /tmp/sample-sites/servers/${ENFORCER_NAME}/px_config.json .
COPY --from=builder /tmp/sample-sites/servers/${ENFORCER_NAME}/config.inc.json .

WORKDIR /app/servers/${ENFORCER_NAME}/origin
COPY --from=builder /tmp/sample-sites/servers/${ENFORCER_NAME}/origin/public/ public/
COPY servers/${ENFORCER_NAME}/origin/package.json .
RUN npm install
COPY servers/${ENFORCER_NAME}/origin/*.js .

ARG PORT=3000
ENV PORT ${PORT}

EXPOSE ${PORT}
CMD ["npm", "start"]