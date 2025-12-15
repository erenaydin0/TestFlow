# Use the official Playwright image which includes all browser dependencies
# Check package.json for the matching version of @playwright/test
FROM mcr.microsoft.com/playwright:v1.55.1-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including dev dependencies for tsx/types)
# We use npm install to be more forgiving with lockfile mismatches
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Environment variables should be passed at runtime, but we can set defaults
ENV NODE_ENV=production

# The agent runs via the defined script in package.json
# Using "npm run agent"
CMD ["npm", "run", "agent"]
