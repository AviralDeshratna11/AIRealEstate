FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Copy source
COPY . .

# Build and run
RUN npm run build
RUN npm install -g serve

ENV PORT=3000
EXPOSE 3000
CMD ["serve", "out", "-l", "3000"]
