# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# --- Stage 2: Build ---
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Initialize SQLite database with schema + seed data during build
# This runs with all deps available, avoid runtime prisma CLI issues
ENV DATABASE_URL="file:/app/data/prod.db"
RUN mkdir -p /app/data
RUN npx prisma db push --skip-generate
RUN node prisma/seed.js

# Build Next.js (standalone)
RUN npm run build

# --- Stage 3: Production ---
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl su-exec
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy the initialized database as a seed template
COPY --from=builder /app/data/prod.db /app/data/seed.db

# Copy Prisma schema (for reference)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Entrypoint: if no DB exists, copy seed DB, then start
COPY <<'EOF' /app/entrypoint.sh
#!/bin/sh
set -e

# Fix data directory permissions
chown -R nextjs:nodejs /app/data

# If no production database exists, copy the seed template
if [ ! -f /app/data/prod.db ] || [ ! -s /app/data/prod.db ]; then
  echo "==> Initializing database from seed template..."
  rm -f /app/data/prod.db
  cp /app/data/seed.db /app/data/prod.db
  chown nextjs:nodejs /app/data/prod.db
  echo "==> Database ready with seeded users!"
fi

echo "==> Starting server..."
exec su-exec nextjs:nodejs node server.js
EOF
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

CMD ["/app/entrypoint.sh"]
