# Use Node.js LTS with security updates
FROM node:18.18.2-slim

# Security: Create non-root user first
RUN groupadd -r codehub && useradd -r -g codehub -d /app -s /sbin/nologin codehub

WORKDIR /app

# Security: Update packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY --chown=codehub:codehub package*.json ./

# Install dependencies with security audit
RUN npm ci --only=production --audit --audit-level=moderate && \
    npm cache clean --force

# Copy application code
COPY --chown=codehub:codehub src/ ./src/
COPY --chown=codehub:codehub scripts/ ./scripts/

# Security: Set proper permissions
RUN chmod -R 555 ./src ./scripts

# Create necessary directories with proper permissions
RUN mkdir -p ./temp ./logs ./uploads && \
    chown -R codehub:codehub ./temp ./logs ./uploads && \
    chmod 755 ./temp ./logs ./uploads

# Security: Switch to non-root user
USER codehub

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# Run the application
CMD ["node", "src/server.js"]