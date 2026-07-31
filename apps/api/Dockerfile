FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app
# Copy only production dependencies from the builder stage
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
EXPOSE 3000
# Run as non-root user
USER node
CMD ["node", "src/index.js"]
