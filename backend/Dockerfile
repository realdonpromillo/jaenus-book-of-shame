FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Create the uploads directory INSIDE the container
RUN mkdir -p uploads

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "server.js"]