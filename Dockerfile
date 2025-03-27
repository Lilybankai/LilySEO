FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies and explicitly add Redis
RUN npm install --production=false
RUN npm install @upstash/redis

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
# Add mock environment variables to enable build even when credentials aren't available
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder-supabase-url.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
ENV SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key
ENV UPSTASH_REDIS_REST_URL=https://placeholder-redis-url.upstash.io
ENV UPSTASH_REDIS_REST_TOKEN=placeholder-token

# Build the application
RUN npm run build:css
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/src/app/tailwind-output.css ./src/app/tailwind-output.css

# Set proper permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"] 