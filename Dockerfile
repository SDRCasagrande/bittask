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

# Initialize SQLite database with schema + seed during build
# (all deps available here, avoids runtime prisma CLI issues)
RUN mkdir -p /app/seed
ENV DATABASE_URL="file:/app/seed/prod.db"
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

# Copy seed DB template to /app/seed (NOT /app/data which gets volume-mounted)
COPY --from=builder /app/seed/prod.db /app/seed/seed.db

# Copy Prisma schema (for reference)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Entrypoint: if no DB exists, copy seed template from /app/seed/
COPY <<'EOF' /app/entrypoint.sh
#!/bin/sh
set -e

chown -R nextjs:nodejs /app/data

if [ ! -f /app/data/prod.db ] || [ ! -s /app/data/prod.db ]; then
  echo "==> No database found. Copying seed template..."
  rm -f /app/data/prod.db
  cp /app/seed/seed.db /app/data/prod.db
  chown nextjs:nodejs /app/data/prod.db
  echo "==> Database initialized with seeded users!"
else
  echo "==> Existing database found, using it."
fi

echo "==> Starting server..."
exec su-exec nextjs:nodejs node server.js
EOF
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

CMD ["/app/entrypoint.sh"]
