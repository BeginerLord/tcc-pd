# syntax=docker/dockerfile:1.5

##########
# Deps
##########
FROM node:20-alpine AS deps
WORKDIR /app

# Qué app empaquetar: api-gateway | main-api | scraping-service
ARG APP_DIR=api-gateway
ENV APP_DIR=${APP_DIR}

# Instala deps solo de la app seleccionada
COPY ${APP_DIR}/package*.json ./
# Si usas lockfile, cópialo también (si existe)
# COPY ${APP_DIR}/package-lock.json ./
RUN npm ci --omit=dev

##########
# Build (TS u otros pasos)
##########
FROM node:20-alpine AS build
WORKDIR /app
ARG APP_DIR
ENV APP_DIR=${APP_DIR}

COPY --from=deps /app/node_modules ./node_modules
COPY ${APP_DIR}/ ./

# Compila si existe script "build"; si no, continúa
RUN npm run build || echo "no build script"

##########
# Runtime
##########
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Render necesita que expongas en 0.0.0.0
ENV HOST=0.0.0.0

# Lleva solo lo necesario al runtime
COPY --from=build /app ./

# Por defecto usa "npm run start" (puedes sobrescribirlo en Render → Start Command)
CMD ["npm", "run", "start"]
