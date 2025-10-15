# Build stage
FROM node:alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

COPY --chown=nestjs:nodejs src/database/data ./src/database/data
COPY --chown=nestjs:nodejs src/database/init.sql ./src/database/init.sql

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/main.js --health-check || exit 1

CMD ["node", "dist/main.js"]
