# Multi-stage build for PropIntel AI Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy source code and build TypeScript
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled dist output from builder
COPY --from=builder /app/dist ./dist

EXPOSE 5000

USER node

CMD ["node", "dist/src/server.js"]
