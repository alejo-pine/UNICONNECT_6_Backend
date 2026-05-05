# ──────────────────────────────────────────────
# Stage 1: builder — instala todas las dependencias y compila TypeScript
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# Instalar TODAS las dependencias (incluidas devDependencies para tsc)
RUN npm ci

COPY . .

# Compilar TypeScript → dist/ (outDir definido en tsconfig.json)
RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: runner — imagen mínima de producción sin .ts ni devDependencies
# ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
# Solo dependencias de producción (sin devDependencies)
RUN npm ci --omit=dev

# Copiar únicamente el código JS compilado desde el stage builder
COPY --from=builder /app/dist ./dist

EXPOSE ${PORT:-3002}

CMD ["node", "dist/server.js"]

