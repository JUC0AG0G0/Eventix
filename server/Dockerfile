# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Outils nécessaires pour compiler (TS, modules natifs si besoin)
RUN apk add --no-cache python3 make g++

# Assure la présence des dossiers qui pourraient être absents
RUN mkdir -p /app/public /app/prisma

# Copier uniquement les manifests pour profiter du cache Docker
COPY package*.json ./

# Installer toutes les dépendances (incl. dev) pour builder
RUN npm ci

# Copier le code et builder
COPY . .
RUN npm run build

# Enlever les deps de dev pour n'avoir que la prod dans node_modules
# (optionnel mais recommandé pour alléger l'image finale)
RUN npm prune --production

# ---------- Production stage ----------
FROM node:20-alpine AS runner

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV SERVER_PORT=9010

WORKDIR /app

# Installer curl pour healthcheck (root)
RUN apk add --no-cache curl

# Copier le build + node_modules depuis builder (aucun package*.json copié ici)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

RUN chown -R node:node /app
USER node

EXPOSE 9010

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD [ "sh", "-c", "curl -fsS http://localhost:${SERVER_PORT}/health || exit 1" ]

CMD ["node", "dist/main.js"]
