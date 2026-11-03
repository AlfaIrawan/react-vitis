FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig*.json postcss.config.js tailwind.config.js ./
COPY src ./src
COPY public ./public
# VITE_* values are public and embedded during build. Never put secrets here.
COPY deploy/frontend.env ./.env.production
RUN npm run build

FROM nginx:stable-alpine
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
