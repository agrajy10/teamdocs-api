# syntax=docker/dockerfile:1

# ---------- base ----------
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---------- development ----------
FROM base AS dev
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# ---------- production ----------
FROM base AS prod
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
