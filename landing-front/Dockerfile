FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_WHATSAPP_NUMBER=5500000000000
ARG VITE_API_URL=

ENV VITE_WHATSAPP_NUMBER=${VITE_WHATSAPP_NUMBER}
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx/spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
