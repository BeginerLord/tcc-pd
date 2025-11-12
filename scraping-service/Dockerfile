FROM node:20-alpine

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Use dumb-init to properly handle signals and reap zombie processes
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
