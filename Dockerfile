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
