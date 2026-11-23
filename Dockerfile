FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.21.0 --activate
WORKDIR /app

# ---------- dependencies (build) ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM deps AS build
COPY tsconfig*.json ./
COPY src ./src
COPY test ./test
COPY scripts ./scripts
COPY .dovenv ./.dovenv
COPY .release-it.ts ./
RUN pnpm typecheck && pnpm exec tsc

# ---------- production dependencies ----------
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---------- runtime ----------
FROM node:24-alpine AS runtime
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production

WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --from=prod-deps --chown=node:node /app/node_modules/nodemailer/LICENSE ./THIRD_PARTY_LICENSES/nodemailer-LICENSE
COPY --from=prod-deps --chown=node:node /app/node_modules/node-cron/LICENSE.md ./THIRD_PARTY_LICENSES/node-cron-LICENSE.md
COPY --from=prod-deps --chown=node:node /app/node_modules/node-html-parser/LICENSE ./THIRD_PARTY_LICENSES/node-html-parser-LICENSE

USER node
ENTRYPOINT ["dumb-init", "--", "node", "dist/index.js"]
CMD ["server", "--res", "markdown"]
