FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl-dev musl-dev
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile
RUN yarn add sharp --ignore-engines

COPY prisma ./prisma
RUN npx prisma generate


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN \
  npx nx run api:build:production


# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

RUN chown nodejs:nodejs /app

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist/apps/api .

USER nodejs

EXPOSE 3000
ENV PORT 3000

CMD HOSTNAME="0.0.0.0" node main.js