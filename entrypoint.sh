#!/bin/bash

# Substitute Railway dynamic $PORT if provided into nginx config
PORT_NUMBER=${PORT:-80}
sed -i "s/listen 80;/listen ${PORT_NUMBER};/g" /etc/nginx/sites-available/default 2>/dev/null || sed -i "s/listen 80;/listen ${PORT_NUMBER};/g" /etc/nginx/conf.d/default.conf 2>/dev/null

echo "Starting WhatsApp Gateway on port 3001..."
(cd /app/whatsapp-service && node server.js) &

echo "Starting FastAPI Backend on port 8000..."
(cd /app/backend && uvicorn app.main:app --host 127.0.0.1 --port 8000) &

echo "Starting Nginx on port ${PORT_NUMBER}..."
nginx -g "daemon off;"
