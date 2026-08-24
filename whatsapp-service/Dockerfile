FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Directory for persistent auth state
VOLUME ["/app/auth_info_baileys"]

EXPOSE 3001

CMD ["node", "server.js"]
