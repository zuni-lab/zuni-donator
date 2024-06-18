FROM node:20-buster AS base 
WORKDIR /app

ENV PATH="/root/.bun/bin:${PATH}"
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://bun.sh/install | bash && \
    bun install -g husky && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app

RUN mkdir -p /temp/dev
COPY package.json  bun.lockb tsconfig.json /temp/dev
RUN cd /temp/dev && bun install --frozen-lockfile

# # Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /temp/dev/node_modules ./node_modules
COPY . .
ENV NODE_ENV production
RUN bun run build

# # Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && chown -R nextjs:nodejs /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]