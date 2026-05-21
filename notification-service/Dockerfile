FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx tsc --module commonjs

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN node -e "const p=require('fs');const pkg=JSON.parse(p.readFileSync('package.json'));delete pkg.type;p.writeFileSync('package.json',JSON.stringify(pkg,null,2));"
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE ${PORT:-3005}

CMD ["node", "dist/server.js"]
