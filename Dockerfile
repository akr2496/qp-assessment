# Use the official Node.js image as a base
FROM node:14-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

ENV USERNAME    = ashishranjan
ENV HOST        = localhost
ENV DATABASE    = ashishranjan
ENV PASSWORD    =
ENV DB_PORT     = 5432

# Expose the port the app runs on
EXPOSE 4000

# Start the Node.js application
CMD ["node", "index.js"]
