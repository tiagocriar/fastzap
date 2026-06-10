FROM node:22-slim AS deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-slim AS production

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY src ./src
COPY migrations ./migrations
COPY package.json ./

RUN mkdir -p /app/sessions

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 appuser \
    && chown -R appuser:nodejs /app

USER appuser

EXPOSE 3333

ENV NODE_ENV=production

CMD ["sh", "-c", "npm run migrate && node src/main.js"]
