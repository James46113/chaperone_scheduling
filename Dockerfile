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
COPY --from=build-stage /app/public/.htaccess /usr/local/apache2/htdocs/.htaccess

# Create a custom Apache configuration file
RUN echo '<Directory "/usr/local/apache2/htdocs">\n    AllowOverride All\n    Require all granted\n</Directory>' > /usr/local/apache2/conf/extra/httpd-override.conf

# Include the custom configuration file in the main Apache configuration
RUN echo 'Include conf/extra/httpd-override.conf' >> /usr/local/apache2/conf/httpd.conf