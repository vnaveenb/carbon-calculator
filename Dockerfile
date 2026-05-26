# ── Production image ────────────────────────────────────────────────────────────
FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY app.js db.js ./
COPY routes/ ./routes/
COPY views/ ./views/
COPY public/ ./public/
COPY store/ ./store/
COPY data/ ./data/

# Multer upload target must exist
RUN mkdir -p uploads

EXPOSE 4000

ENV NODE_ENV=production \
    PORT=4000

CMD ["node", "app.js"]
