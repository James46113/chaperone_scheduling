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
RUN echo 'LoadModule rewrite_module modules/mod_rewrite.so\n\
<Directory "/usr/local/apache2/htdocs">\n\
    AllowOverride None\n\
    Require all granted\n\
    RewriteEngine On\n\
    RewriteCond %{REQUEST_FILENAME} !-f\n\
    RewriteCond %{REQUEST_FILENAME} !-d\n\
    RewriteRule ^.*$ /index.html [L,QSA]\n\
</Directory>' > /usr/local/apache2/conf/extra/httpd-rewrite.conf

# Include the custom configuration file in the main Apache configuration
RUN echo 'Include conf/extra/httpd-rewrite.conf' >> /usr/local/apache2/conf/httpd.conf