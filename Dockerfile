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
COPY --from=build-stage /app/dist /usr/local/apache2/htdocs/

# Create a custom Apache configuration file with rewrite rules
RUN echo '<Directory "/usr/local/apache2/htdocs">\nAllowOverride None\nRequire all granted\nRewriteEngine On\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^.*$ /index.html [L,QSA]\n</Directory>' > /usr/local/apache2/conf/extra/httpd-rewrite.conf

# Include the custom configuration file in the main Apache configuration
RUN echo 'Include conf/extra/httpd-rewrite.conf' >> /usr/local/apache2/conf/httpd.conf