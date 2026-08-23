# ── Multi-stage Dockerfile for Frontend (Bun + Vite -> Nginx) ───────────────
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy dependency files and install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code and build production assets
COPY . .
RUN bun run build

# ── Production Nginx Stage ───────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy customized Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA bundle from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
