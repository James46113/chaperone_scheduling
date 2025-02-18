# Stage 1: Build the application
FROM node:20 as build-stage
WORKDIR /app
COPY package*.json ./
COPY .env ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Set up the Express server and Apache server
FROM node:20 as server-stage
WORKDIR /app
COPY package*.json ./
COPY .env ./
RUN npm install
COPY public/server.js ./server.js
COPY --from=build-stage /app/dist /app/dist

# Install Apache
RUN apt-get update && apt-get install -y apache2 && apt-get clean

# Enable necessary Apache modules
RUN sed -i '/LoadModule rewrite_module/s/^#//g' /etc/apache2/apache2.conf && \
    sed -i '/LoadModule proxy_module/s/^#//g' /etc/apache2/apache2.conf && \
    sed -i '/LoadModule proxy_http_module/s/^#//g' /etc/apache2/apache2.conf && \
    sed -i 's#AllowOverride [Nn]one#AllowOverride All#' /etc/apache2/apache2.conf

RUN echo 'ServerName chaperones.steelcitychoristers.org.uk' >> /etc/apache2/apache2.conf

RUN echo 'Listen 8080' >> /etc/apache2/apache2.conf

# Add reverse proxy configuration
RUN echo 'ProxyPass /api http://localhost:3000/api' >> /etc/apache2/apache2.conf && \
    echo 'ProxyPassReverse /api http://localhost:3000/api' >> /etc/apache2/apache2.conf

EXPOSE 3000 8080

# Start both servers
CMD ["sh", "-c", "node server.js & apache2ctl -D FOREGROUND"]

COPY --from=build-stage /app/dist /var/www/html/