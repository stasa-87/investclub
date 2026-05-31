# Set the base image to Node.js (Alpine for smaller image size)
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port that the Vite development server uses
EXPOSE 5173

# Command to start the application
CMD ["npm", "run", "dev", "--", "--host=0.0.0.0"]