# ---- build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ---- production stage ----
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY server/ ./server/
COPY --from=builder /app/dist ./dist
RUN mkdir -p data uploads
EXPOSE 3001
CMD ["node", "server/index.js"]
