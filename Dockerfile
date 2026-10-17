# syntax=docker/dockerfile:1

# --- Build the static site -------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

RUN npm install -g pnpm@9.1.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# Where the photos are served from (the images service, behind the proxy).
ARG VITE_IMAGES_URL=https://img.zmelendez.com
ENV VITE_IMAGES_URL=$VITE_IMAGES_URL
RUN pnpm build

# --- Serve it with nginx, as a non-root user on port 8080 -------------------
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
