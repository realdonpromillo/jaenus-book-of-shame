# Stage 1: Build the React application
FROM node:18-alpine as build-stage

WORKDIR /app

# Copy package files first for dependency caching
COPY package*.json ./
RUN npm install

# Explicitly copy the public and src directories
COPY public ./public
COPY src ./src

# --- CRITICAL DEBUGGING STEP ---
RUN echo "--- [DEBUG] Listing /app contents (after explicit copy) ---" && \
    ls -la /app && \
    echo "--- [DEBUG] Listing /app/public contents ---" && \
    (ls -la /app/public || echo "!!! [DEBUG] /app/public directory not found or ls failed !!!") && \
    echo "--- [DEBUG] Checking specifically for /app/public/index.html ---" && \
    (ls -l /app/public/index.html && echo "[DEBUG] Found /app/public/index.html") || echo "!!! [DEBUG] /app/public/index.html NOT FOUND !!!" && \
    echo "--- [DEBUG] End of checks ---"
# --- END CRITICAL DEBUGGING STEP ---

# ARG to receive the API URL from docker-compose build
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Build the static files
RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:stable-alpine

# Copy static files from the build stage
COPY --from=build-stage /app/build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]