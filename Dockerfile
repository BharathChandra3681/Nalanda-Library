# ============================================
# Stage 1: Build stage
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# ============================================
# Stage 2: Production stage
# ============================================
FROM node:20-alpine AS production

# Add labels for better maintainability
LABEL maintainer="bharathchandra3681@gmail.com"
LABEL description="Nalanda Library Management System API"
LABEL version="1.0.0"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodeuser:nodejs . .

# Remove unnecessary files
RUN rm -rf .git .env.example .gitignore Dockerfile docker-compose*.yml

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start the application
CMD ["node", "src/app.js"]
