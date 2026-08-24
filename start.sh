#!/bin/bash

# CarpenterBullet WhatsApp CRM - All-in-One Startup Script

echo "========================================================"
echo "   🚀 Starting CarpenterBullet WhatsApp CRM Stack      "
echo "========================================================"

# Trap to kill background processes on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start WhatsApp Gateway Service
echo "📦 [1/3] Starting WhatsApp Gateway on port 3001..."
(cd whatsapp-service && npm start) &

# 2. Start FastAPI Backend
echo "🐍 [2/3] Starting FastAPI Backend on port 8000..."
(cd backend && ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) &

# 3. Start Vite Frontend
echo "💻 [3/3] Starting React + Vite Frontend on port 5173..."
(cd frontend && npm run dev) &

echo "========================================================"
echo "   All services launched!"
echo "   🌐 Frontend UI: http://localhost:5173"
echo "   📡 Backend API: http://localhost:8000/docs"
echo "   📱 WhatsApp Gateway: http://localhost:3001/status"
echo "========================================================"
echo "Press Ctrl+C to stop all services."

wait
