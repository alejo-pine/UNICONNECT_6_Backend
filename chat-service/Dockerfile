# ──────────────────────────────────────────────
# Stage 1: builder — instala todas las dependencias
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# ──────────────────────────────────────────────
# Stage 2: runner — ejecuta con tsx
# ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src

EXPOSE 3004

CMD ["./node_modules/.bin/tsx", "src/index.ts"]

