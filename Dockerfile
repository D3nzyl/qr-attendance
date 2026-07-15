# ---- build stage ----
FROM node:22-alpine AS builder
WORKDIR /app
# openssl is required by the Prisma query engine on Alpine (musl)
RUN apk add --no-cache openssl
RUN corepack enable
# Copy the Prisma schema before install so the postinstall `prisma generate` succeeds
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- production stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
RUN corepack enable
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json
RUN mkdir -p uploads
EXPOSE 3001
CMD ["pnpm", "exec", "next", "start", "-p", "3001"]
