# Multi-stage build for React + Express
FROM node:20-alpine AS base

# Frontend Build
FROM base AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Backend Build
FROM base AS backend-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Production Image
FROM base AS runner
WORKDIR /app

# Copy Backend
COPY --from=backend-build /app/server/dist ./dist
COPY --from=backend-build /app/server/node_modules ./node_modules
COPY --from=backend-build /app/server/prisma ./prisma
COPY --from=backend-build /app/server/package.json ./package.json

# Copy Frontend to be served by Backend or Nginx
# For simplicity in this mono-container prototype, we'll put it in a public dir
COPY --from=frontend-build /app/frontend/dist ./public_frontend

ENV NODE_ENV=production
EXPOSE 5001

CMD ["node", "dist/index.js"]
