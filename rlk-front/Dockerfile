FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=/api/v1
ARG VITE_MAPBOX_TOKEN=

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_MAPBOX_TOKEN=${VITE_MAPBOX_TOKEN}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx vite build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx/spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
