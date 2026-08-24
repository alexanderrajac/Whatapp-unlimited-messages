# 🌐 Deployment Guide - CarpenterBullet WhatsApp CRM

This guide covers how to deploy **CarpenterBullet WhatsApp CRM** so that your team or users can access and use it from anywhere on the internet.

---

## ⚡ Option 1: Docker Compose on VPS (Recommended)

Deploy to any Cloud VPS (**DigitalOcean, AWS EC2, Hetzner, Linode, Hostinger**) running Ubuntu 22.04 / 24.04.

### 1. Connect to your VPS:
```bash
ssh root@your-server-ip
```

### 2. Install Docker & Docker Compose:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose-plugin
```

### 3. Clone or Copy your codebase to the server:
```bash
git clone <your-repo-url> /opt/whtapp
cd /opt/whtapp
```

### 4. Build and Start All Containers with 1 Command:
```bash
docker compose up -d --build
```

### 5. Access your CRM:
Open `http://your-server-ip` in your browser. All services (Frontend, FastAPI Backend, and WhatsApp Gateway) will be up and running with automatic restarts and persistent session storage!

---

## 🔒 Adding Free SSL & Custom Domain (HTTPS)

To run on your custom domain (e.g. `https://crm.yourcompany.com`) with a free SSL certificate:

### 1. Point your Domain DNS:
Add an **A Record** pointing `crm.yourcompany.com` to your server's IP.

### 2. Install Certbot (Let's Encrypt):
```bash
apt install -y certbot python3-certbot-nginx nginx
```

### 3. Create Nginx Configuration (`/etc/nginx/sites-available/whtapp`):
```nginx
server {
    server_name crm.yourcompany.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Enable the site and obtain SSL:
```bash
ln -s /etc/nginx/sites-available/whtapp /etc/nginx/sites-enabled/
certbot --nginx -d crm.yourcompany.com
systemctl restart nginx
```

Now your CRM is live at **`https://crm.yourcompany.com`** with full SSL encryption!

---

## 🚀 Option 2: Instant Public URL with Cloudflare Tunnel (Zero Port Forwarding)

If you want to host it directly on your machine or private server without opening firewall ports or setting up static IPs:

1. Install Cloudflare Tunnel (`cloudflared`):
   ```bash
   # On macOS
   brew install cloudflared

   # On Linux
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   dpkg -i cloudflared.deb
   ```

2. Start the quick tunnel pointing to your frontend:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```

Cloudflare will give you a public HTTPS URL (e.g. `https://random-name.trycloudflare.com`) that anyone can access immediately!

---

## ☁️ Option 3: PaaS Cloud Platforms (Railway / Render / CapRover / Coolify)

### Deploying on Railway:
1. Push your code to a GitHub repository.
2. Go to [Railway.app](https://railway.app) > **New Project** > **Deploy from GitHub repo**.
3. Railway will auto-detect the `docker-compose.yml` or Dockerfiles and provide a public `.up.railway.app` HTTPS domain!

### Deploying on Coolify / CapRover (Self-Hosted PaaS):
1. Create a new application from Git repository.
2. Select **Docker Compose Deployment**.
3. Click **Deploy**.

---

## 💾 Data Persistence & Backups

Your session and campaign data are preserved across restarts in Docker volumes:
- **WhatsApp Device Session**: `whatsapp_session_data` (`/app/auth_info_baileys`)
- **Database & Contacts**: `backend_data` (`/app/whatsapp_crm.db`)

To backup your CRM data:
```bash
# Backup SQLite DB
cp /opt/whtapp/backend/whatsapp_crm.db /opt/backups/whatsapp_crm_$(date +%F).db

# Backup WhatsApp Login Session
tar -czvf /opt/backups/whatsapp_session_$(date +%F).tar.gz /var/lib/docker/volumes/whtapp_whatsapp_session_data
```
