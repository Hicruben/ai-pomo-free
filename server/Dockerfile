FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production --legacy-peer-deps

COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]