# Front door for site images: serves the full-size originals and puts a cache
# and an allowlist in front of transformimgs. Built from the repo root.
FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY images/nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY images/transform.conf /etc/nginx/snippets/transform.conf
# Pre-encodes every srcset width into the cache at start and daily.
COPY --chmod=755 images/warm.sh /usr/local/bin/warm-images
COPY --chmod=755 images/90-warm-cache.sh /docker-entrypoint.d/90-warm-cache.sh

# Owned by nginx so a named volume mounted here inherits a writable directory.
USER root
RUN mkdir -p /var/cache/images && chown nginx:nginx /var/cache/images
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
