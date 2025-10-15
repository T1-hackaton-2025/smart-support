FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S frontend -u 1001

RUN npm install -g serve

COPY --from=builder --chown=frontend:nodejs /app/dist ./dist

USER frontend

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]