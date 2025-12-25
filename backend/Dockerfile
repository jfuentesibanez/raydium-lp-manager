# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm install -g tsx typescript
RUN npm run build

# Expose port (Railway requires this even if not used for HTTP)
EXPOSE 3000

# Run the monitor command
CMD ["npm", "start"]
