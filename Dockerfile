# Stage 1: Build the application
FROM node:20 as build-stage
WORKDIR /app
COPY package*.json ./
COPY .env.production ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application with Apache
FROM httpd:alpine

RUN sed -i '/LoadModule rewrite_module/s/^#//g' /usr/local/apache2/conf/httpd.conf && \
sed -i 's#AllowOverride [Nn]one#AllowOverride All#' /usr/local/apache2/conf/httpd.conf

COPY --from=build-stage /app/dist /usr/local/apache2/htdocs/