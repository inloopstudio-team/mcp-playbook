FROM node:23-slim AS builder

WORKDIR /app

# Install build tools required for native modules like sqlite3
RUN apt-get update && apt-get install -y build-essential python3

COPY . .

# Remove --ignore-scripts to allow native module compilation
RUN npm ci
RUN npm run build

ENTRYPOINT ["node", "dist/src/index.js"]