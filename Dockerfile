FROM node:20-bullseye-slim

# Install Python 3, pip, and Nginx
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    nginx \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Build Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 2. Setup Backend
COPY backend/requirements.txt ./backend/
RUN pip3 install --no-cache-dir -r ./backend/requirements.txt
COPY backend/ ./backend/

# 3. Setup WhatsApp Service
COPY whatsapp-service/package*.json ./whatsapp-service/
RUN cd whatsapp-service && npm ci --omit=dev
COPY whatsapp-service/ ./whatsapp-service/

# 4. Setup Nginx and Entrypoint
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/sites-available/default
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 80 8000 3001

CMD ["/app/entrypoint.sh"]
