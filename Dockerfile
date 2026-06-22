# v1.16.0: Multi-stage build for smaller image size
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production && npm cache clean --force

FROM node:20-alpine
WORKDIR /app
# v1.16.0: Non-root user for security
RUN addgroup -g 1001 -S blossom && adduser -S blossom -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN chown -R blossom:blossom /app
USER blossom
EXPOSE 3002
# v1.16.0: Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/api/health || exit 1
CMD ["node", "server.js"]
