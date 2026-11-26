# Stage 1: Build React + Vite production bundle
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_AI_ANALYSIS_MODE=demo
ARG VITE_PROPERTY_ANALYSIS_DEMO=true
ENV VITE_AI_ANALYSIS_MODE=$VITE_AI_ANALYSIS_MODE
ENV VITE_PROPERTY_ANALYSIS_DEMO=$VITE_PROPERTY_ANALYSIS_DEMO

RUN npm run build

# Stage 2: Nginx static server + reverse proxy
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
