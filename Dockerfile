FROM node:23-slim AS builder

WORKDIR /app

COPY . .
RUN npm ci --ignore-scripts
RUN npm run build

ENTRYPOINT ["node", "dist/src/index.js"]