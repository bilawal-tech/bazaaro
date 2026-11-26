FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Pehle sirf package files, taake code badalne par npm install dobara na chale
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Uploads folder (compose mein host ka folder yahan lagta hai)
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
USER node

EXPOSE 5000
CMD ["node", "server.js"]
