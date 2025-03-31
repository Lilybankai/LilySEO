FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies and explicitly add Redis
RUN npm install --production=false --legacy-peer-deps
RUN npm install @upstash/redis

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SUPABASE_URL=https://fleanljrxzbpayfsviec.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZWFubGpyeHpicGF5ZnN2aWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MzIxNDUsImV4cCI6MjA1NzMwODE0NX0.TkkssDKy8KAI80IXYPsk44rWt1SqXOXj_zbYvkP4igk
ENV SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZWFubGpyeHpicGF5ZnN2aWVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTczMjE0NSwiZXhwIjoyMDU3MzA4MTQ1fQ.NxG8KGHDd3swZVFPFm_TkaXa8PyGP84Zm7KNlVKRtPE
ENV UPSTASH_REDIS_REST_URL=https://fitting-adder-46027.upstash.io
ENV UPSTASH_REDIS_REST_TOKEN=AbPLAAIjcDEzNzY4YTc1ZWY0MDM0MGJlOWVjOTcxOTI4NDFhYTMwNnAxMA

# Build the application
RUN npm run build:css
RUN NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY npm run build

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