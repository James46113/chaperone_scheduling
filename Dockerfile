# Stage 1: Build the application
FROM node:20 as build-stage
WORKDIR /app
COPY package*.json ./
COPY .env.production ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM httpd:alpine
COPY --from=build-stage /app/dist /usr/local/apache2/htdocs/
COPY --from=build-stage /app/public/.htaccess ./usr/local/apache2/htdocs/

# Enable .htaccess by updating the Apache configuration
RUN echo "AllowOverride All" >> /usr/local/apache2/conf/httpd.conf