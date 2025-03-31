FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install bash first (needed for dynamic page scripts)
RUN apk add --no-cache bash

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with all optional dependencies
# Removing specific problematic packages we intend to alias/stub
RUN npm install --production=false --legacy-peer-deps

# Install other potentially missing dependencies
# Include @supabase/ssr here, but exclude @hello-pangea/dnd (handled by alias)
RUN npm install @upstash/redis @paypal/react-paypal-js @tanstack/react-query axios geist @supabase/ssr jspdf postcss-import @react-pdf/renderer

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy application code AFTER potentially heavy node_modules copy
COPY . .

# Install bash (needed for dynamic page scripts)
RUN apk add --no-cache bash

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SUPABASE_URL=https://fleanljrxzbpayfsviec.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZWFubGpyeHpicGF5ZnN2aWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MzIxNDUsImV4cCI6MjA1NzMwODE0NX0.TkkssDKy8KAI80IXYPsk44rWt1SqXOXj_zbYvkP4igk
ENV SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZWFubGpyeHpicGF5ZnN2aWVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTczMjE0NSwiZXhwIjoyMDU3MzA4MTQ1fQ.NxG8KGHDd3swZVFPFm_TkaXa8PyGP84Zm7KNlVKRtPE
ENV UPSTASH_REDIS_REST_URL=https://fitting-adder-46027.upstash.io
ENV UPSTASH_REDIS_REST_TOKEN=AbPLAAIjcDEzNzY4YTc1ZWY0MDM0MGJlOWVjOTcxOTI4NDFhYTMwNnAxMA

# Make sure ALL dependencies are properly installed before stubbing
RUN npm install --legacy-peer-deps

# Create stub files ONLY for packages NOT handled by webpack aliases if needed
# This section should now be empty as all known issues are handled by aliases

# Force all pages to be server-side rendered 
# Add dynamic directive in the right position depending on whether "use client" exists
RUN find /app/src/app -type f \( -name "page.tsx" -o -name "page.js" \) -exec bash -c 'if grep -q "use client" "$1"; then sed -i "/use client/a export const dynamic = \"force-dynamic\";" "$1"; else sed -i "1i export const dynamic = \"force-dynamic\";" "$1"; fi' _ {} \;

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

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
# Copy the standalone output
COPY --from=builder /app/.next/standalone ./
# Copy static assets
COPY --from=builder /app/.next/static ./.next/static
# Ensure tailwind output is copied (adjust path if necessary)
COPY --from=builder /app/src/app/tailwind-output.css ./src/app/

# Set proper permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 3000

# Start the application using the standalone server.js
CMD ["node", "server.js"] 
