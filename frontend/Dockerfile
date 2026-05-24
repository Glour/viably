# syntax=docker/dockerfile:1.4
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with cache mount
# This significantly speeds up rebuilds by caching npm packages
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --prefer-offline --no-audit --progress=false

# Development image (OPTIMIZED for speed)
FROM base AS dev
WORKDIR /app

# Copy node modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy package files first (they change less often)
COPY package.json package-lock.json* ./

# Copy config files (change occasionally)
COPY next.config.ts tsconfig.json postcss.config.mjs components.json ./

# Copy all source code (includes env files if they exist)
COPY . .

# Expose port
EXPOSE 3000

# Optimized environment variables for dev speed
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBOPACK_REMOTE_CACHE=1
ENV NEXT_PRIVATE_LOCAL_WEBPACK=1

# Start development server with Turbopack
CMD ["npm", "run", "dev"]

# Production image (for future use)
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build with cache mount for faster rebuilds
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
