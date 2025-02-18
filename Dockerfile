# Stage 1: Build the application
FROM node:20 as build-stage
WORKDIR /app
COPY package*.json ./
COPY .env ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Set up the Express server
FROM node:20 as server-stage
WORKDIR /app
COPY package*.json ./
COPY .env ./
RUN npm install
COPY server.js ./
COPY --from=build-stage /app/dist /app/dist
EXPOSE 3000
CMD ["node", "server.js"]

# Stage 3: Serve the application with Apache
FROM httpd:alpine

# Enable necessary Apache modules
RUN sed -i '/LoadModule rewrite_module/s/^#//g' /usr/local/apache2/conf/httpd.conf && \
    sed -i '/LoadModule proxy_module/s/^#//g' /usr/local/apache2/conf/httpd.conf && \
    sed -i '/LoadModule proxy_http_module/s/^#//g' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's#AllowOverride [Nn]one#AllowOverride All#' /usr/local/apache2/conf/httpd.conf

RUN echo 'ServerName chaperones.steelcitychoristers.org.uk' >> /usr/local/apache2/conf/httpd.conf

RUN echo 'Listen 8080' >> /usr/local/apache2/conf/httpd.conf

# Add reverse proxy configuration
RUN echo 'ProxyPass /api http://localhost:3000/api' >> /usr/local/apache2/conf/httpd.conf && \
    echo 'ProxyPassReverse /api http://localhost:3000/api' >> /usr/local/apache2/conf/httpd.conf

EXPOSE 8080

COPY --from=build-stage /app/dist /usr/local/apache2/htdocs/