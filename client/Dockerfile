# ── Stage 1: build ──
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# VITE_* values build ke waqt client/.env se bundle mein chali jati hain
# (Stripe publishable key aur Google client ID public hoti hain, secret yahan kabhi nahi).
COPY . .
RUN npm run build

# ── Stage 2: sirf static files nginx se ──
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
