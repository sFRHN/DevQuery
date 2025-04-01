FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

WORKDIR /app/frontend
RUN npm install
RUN npm run build

WORKDIR /app

EXPOSE 3000

CMD ["node", "server.js"]