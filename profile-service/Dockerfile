# ──────────────────────────────────────────────
# Stage 1: builder — instala todas las dependencias y compila TypeScript
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# Instalar TODAS las dependencias (incluidas devDependencies para tsc)
RUN npm ci

COPY . .

# Compilar TypeScript → dist/ con module=commonjs para compatibilidad con Node.js ESM
# CORRECCIÓN: package.json tiene "type":"module" pero los imports no tienen extensión .js,
# lo que rompe la resolución ESM. Compilar como CommonJS evita este problema.
RUN npx tsc --module commonjs

# ──────────────────────────────────────────────
# Stage 2: runner — imagen mínima de producción sin .ts ni devDependencies
# ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
# CORRECCIÓN: eliminar "type":"module" para que Node.js trate los .js compilados
# como CommonJS (coincide con la salida de tsc --module commonjs).
RUN node -e "const p=require('fs');const pkg=JSON.parse(p.readFileSync('package.json'));delete pkg.type;p.writeFileSync('package.json',JSON.stringify(pkg,null,2));"
# Solo dependencias de producción (sin devDependencies)
RUN npm ci --omit=dev

# Copiar únicamente el código JS compilado desde el stage builder
COPY --from=builder /app/dist ./dist

EXPOSE ${PORT:-3002}

CMD ["node", "dist/server.js"]

