# Backend IMI Platform (Express + API mockée)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "src/server.js"]