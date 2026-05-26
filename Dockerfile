# ── Stage 1: build webpack bundle ──────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: production image ───────────────────────────────────────────────────
FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source and built assets
COPY --from=builder /app/dist ./dist
COPY app.js db.js webpack.config.js ./
COPY routes/ ./routes/
COPY views/ ./views/
COPY public/ ./public/
COPY store/ ./store/

# Multer upload target must exist
RUN mkdir -p uploads

EXPOSE 4000

ENV NODE_ENV=production \
    PORT=4000

CMD ["node", "app.js"]
