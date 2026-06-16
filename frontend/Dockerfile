FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Copy source
COPY . .

# Build the Next.js server bundle (.next). We intentionally do NOT use the
# static `output: export` path here — the app has server routes (auth-callback
# handling on "/") that require a running Next.js server.
RUN npm run build

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

# `next start` serves the .next build and respects the PORT env var.
CMD ["npm", "run", "start"]
