FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# `npm run preview` est un serveur de developpement, explicitement deconseille
# en production par Vite : pas de compression, pas de cache, mono-processus.
# nginx sert le build et proxifie /api, ce qui place le frontend et l'API sur la
# meme origine — VITE_API_URL devient inutile, le repli /api de lib/api.js suffit.
FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
