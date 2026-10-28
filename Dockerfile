# Multi-stage Dockerfile for MailSentinel AI Frontend
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build Vite production bundle
RUN npm run build

# Production web server using lightweight Nginx
FROM nginx:alpine as runner

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx configuration for single page application routing
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

