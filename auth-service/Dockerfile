# ──────────────────────────────────────────────
# Stage 1: builder — instala dependencias de producción
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# Instalar TODAS las dependencias (incluidas dev) para poder usar tsx
RUN npm ci

COPY . .

# ──────────────────────────────────────────────
# Stage 2: runner — ejecuta con tsx (soporta ESM + TypeScript nativo)
# ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar package.json y node_modules completos (tsx está en devDependencies)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src

EXPOSE 3001

# tsx ejecuta TypeScript directamente sin necesidad de compilar a JS
CMD ["./node_modules/.bin/tsx", "src/server.ts"]

