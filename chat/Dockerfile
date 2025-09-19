# Use Node.js 18 alpine image as base
FROM node:20-alpine AS builder

# Enable corepack for yarn support
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy package.json and yarn.lock (if available)
COPY package*.json yarn.lock* ./

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build the application
RUN yarn run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
