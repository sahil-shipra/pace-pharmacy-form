# Step 1: Build the React App with Vite
FROM node:slim AS build

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the React app for production
RUN npm run build

# Step 2: Serve with NGINX
FROM nginx:alpine

# Copy the build directory from the previous stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Expose NGINX port
EXPOSE 80

# Start NGINX in the foreground
CMD ["nginx", "-g", "daemon off;"]
