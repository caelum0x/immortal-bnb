# Multi-stage Dockerfile for Immortal AI Trading Bot
# Optimized for production deployment

# ===================================
# Stage 1: Base Image
# ===================================
FROM oven/bun:1 AS base
WORKDIR /app

# ===================================
# Stage 2: Dependencies
# ===================================
FROM base AS deps

# Copy package files
COPY package.json bun.lockb* ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# ===================================
# Stage 3: Build (if needed)
# ===================================
FROM base AS builder

# Copy package files and install all dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript (optional - Bun can run TS directly)
# RUN bun build src/index.ts --outdir dist --target node

# ===================================
# Stage 4: Runtime
# ===================================
FROM base AS runner

# Set production environment
ENV NODE_ENV=production
ENV PORT=3001

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 botuser

# Copy dependencies from deps stage
COPY --from=deps --chown=botuser:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=botuser:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown -R botuser:nodejs logs

# Switch to non-root user
USER botuser

# Expose API port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun run healthcheck || exit 1

# Start the application
CMD ["bun", "run", "src/index.ts"]
