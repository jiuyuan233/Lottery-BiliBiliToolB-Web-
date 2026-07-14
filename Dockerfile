FROM node:18-alpine

RUN apk add --no-cache docker-cli docker-cli-compose

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001

ENV CONFIG_DIR=/data/config
ENV PORT=3001
ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

CMD ["node", "api/index.js"]