FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 8080
CMD ["node", "index.js"]
