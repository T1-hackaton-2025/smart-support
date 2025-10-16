FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install && npm cache clean --force

COPY . .

RUN npm run build

RUN npm prune --omit=dev

COPY src/database/data ./src/database/data
COPY src/database/init.sql ./src/database/init.sql

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
