FROM node:22-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY config.json ./
COPY src/ ./src/

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
