# 🚀 Deployment Guide

**Production Deployment Guide for Immortal AI Trading Bot**

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All tests passing
- [ ] Smart contracts deployed to target network
- [ ] Environment variables configured
- [ ] API keys obtained and secured
- [ ] Trading wallet funded (small amount for testing)
- [ ] Monitoring and alerts configured
- [ ] Backup procedures in place
- [ ] Security audit completed

---

## 🎯 Deployment Options

### Option 1: Docker Compose (Recommended for Single Server)

**Best for**: VPS, dedicated server, local deployment

**Pros**:
- Simple setup
- Easy to manage
- Good for single instance

**Cons**:
- No auto-scaling
- Manual updates required

### Option 2: Kubernetes (Recommended for Production Scale)

**Best for**: Cloud deployment, high availability

**Pros**:
- Auto-scaling
- Self-healing
- Load balancing

**Cons**:
- More complex setup
- Higher cost

### Option 3: Serverless (Future Enhancement)

**Best for**: Minimal overhead, pay-per-use

**Pros**:
- Zero server management
- Cost-effective for low volume

**Cons**:
- Cold starts
- Stateful bot may not be ideal

---

## 🐳 Option 1: Docker Compose Deployment

### Prerequisites

1. **Server Requirements**:
   - Ubuntu 22.04 LTS (or similar)
   - 2+ CPU cores
   - 4GB+ RAM
   - 20GB+ storage
   - Docker and Docker Compose installed

2. **Domain & SSL** (optional but recommended):
   - Domain name pointing to server
   - SSL certificate (Let's Encrypt)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### Step 2: Clone Repository

```bash
# Create application directory
mkdir -p /opt/immortal-bot
cd /opt/immortal-bot

# Clone repository
git clone https://github.com/your-username/immortal-bnb.git .

# Or download release
# wget https://github.com/your-username/immortal-bnb/archive/v1.0.0.tar.gz
# tar -xzf v1.0.0.tar.gz
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Production .env Configuration**:

```bash
# Blockchain
WALLET_PRIVATE_KEY=0x... # Your production wallet private key
NETWORK=mainnet          # or testnet
CHAIN_ID=56              # BSC mainnet

# AI
OPENROUTER_API_KEY=sk-or-v1-...

# Contracts (after deployment)
IMMBOT_TOKEN_ADDRESS=0x...
STAKING_CONTRACT_ADDRESS=0x...

# Trading (CONSERVATIVE!)
MAX_TRADE_AMOUNT_BNB=0.05  # Start small!
STOP_LOSS_PERCENTAGE=5
MIN_LIQUIDITY_USD=100000

# API
API_PORT=3001
API_KEY=<generate-secure-key>

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Monitoring
NODE_ENV=production
LOG_LEVEL=info
SENTRY_DSN=... # Optional

# Frontend
FRONTEND_URL=https://your-domain.com
```

### Step 4: Deploy with Docker Compose

```bash
# Build and start services
docker compose up -d --build

# Check logs
docker compose logs -f bot

# Verify health
curl http://localhost:3001/health
```

### Step 5: Set Up Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install nginx -y

# Create configuration
sudo nano /etc/nginx/sites-available/immortal-bot
```

**Nginx Configuration**:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
    }

    # Frontend (if hosting separately)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable configuration
sudo ln -s /etc/nginx/sites-available/immortal-bot /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (certbot sets this up automatically)
sudo certbot renew --dry-run
```

### Step 7: Configure Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Step 8: Set Up Monitoring

**Systemd Service for Health Monitoring**:

```bash
# Create monitoring script
sudo nano /usr/local/bin/bot-monitor.sh
```

```bash
#!/bin/bash

HEALTH_URL="http://localhost:3001/health"
TELEGRAM_BOT_TOKEN="your-token"
TELEGRAM_CHAT_ID="your-chat-id"

while true; do
    if ! curl -f $HEALTH_URL > /dev/null 2>&1; then
        # Send alert
        curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=🚨 Bot is down! Restarting..."

        # Restart service
        cd /opt/immortal-bot && docker compose restart bot
    fi
    sleep 60
done
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/bot-monitor.sh

# Create systemd service
sudo nano /etc/systemd/system/bot-monitor.service
```

```ini
[Unit]
Description=Immortal Bot Health Monitor
After=docker.service

[Service]
Type=simple
ExecStart=/usr/local/bin/bot-monitor.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start monitoring service
sudo systemctl daemon-reload
sudo systemctl enable bot-monitor
sudo systemctl start bot-monitor
```

### Step 9: Log Rotation

```bash
# Configure logrotate
sudo nano /etc/logrotate.d/immortal-bot
```

```
/opt/immortal-bot/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 docker docker
}
```

### Step 10: Automated Backups

```bash
# Create backup script
sudo nano /usr/local/bin/bot-backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/backups/immortal-bot"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup environment
cp /opt/immortal-bot/.env $BACKUP_DIR/env_$DATE.backup

# Backup logs
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /opt/immortal-bot/logs/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "*.backup" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/bot-backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
```

Add:
```
0 2 * * * /usr/local/bin/bot-backup.sh
```

---

## ⚙️ Option 2: Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (EKS, GKE, AKS, or self-managed)
- kubectl configured
- Docker registry access

### Step 1: Build and Push Docker Image

```bash
# Build image
docker build -t your-registry/immortal-bot:v1.0.0 .

# Push to registry
docker push your-registry/immortal-bot:v1.0.0
```

### Step 2: Create Kubernetes Manifests

**deployment.yaml**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: immortal-bot
  labels:
    app: immortal-bot
spec:
  replicas: 1
  selector:
    matchLabels:
      app: immortal-bot
  template:
    metadata:
      labels:
        app: immortal-bot
    spec:
      containers:
      - name: bot
        image: your-registry/immortal-bot:v1.0.0
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: WALLET_PRIVATE_KEY
          valueFrom:
            secretKeyRef:
              name: bot-secrets
              key: wallet-private-key
        - name: OPENROUTER_API_KEY
          valueFrom:
            secretKeyRef:
              name: bot-secrets
              key: openrouter-api-key
        # ... other env vars from ConfigMap
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

**service.yaml**:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: immortal-bot-service
spec:
  selector:
    app: immortal-bot
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer
```

**secrets.yaml**:

```bash
# Create secrets
kubectl create secret generic bot-secrets \
  --from-literal=wallet-private-key='0x...' \
  --from-literal=openrouter-api-key='sk-or-v1-...'
```

### Step 3: Deploy

```bash
# Apply manifests
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Check status
kubectl get pods
kubectl get services

# View logs
kubectl logs -f deployment/immortal-bot
```

---

## 🔄 Updates and Rollbacks

### Docker Compose Updates

```bash
cd /opt/immortal-bot

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build

# Verify
docker compose logs -f bot
```

### Kubernetes Updates

```bash
# Update image
kubectl set image deployment/immortal-bot bot=your-registry/immortal-bot:v1.1.0

# Check rollout
kubectl rollout status deployment/immortal-bot

# Rollback if needed
kubectl rollout undo deployment/immortal-bot
```

---

## 📊 Post-Deployment Verification

### Checklist

- [ ] Health endpoint responds: `curl https://your-domain.com/health`
- [ ] API endpoints accessible
- [ ] Frontend loads correctly
- [ ] Wallet balance visible in logs
- [ ] Bot can be started/stopped
- [ ] Telegram alerts working
- [ ] SSL certificate valid
- [ ] Firewall configured
- [ ] Monitoring active
- [ ] Backups running
- [ ] Log rotation working

### Test Trading Cycle

```bash
# Start bot
curl -X POST https://your-domain.com/api/start-bot \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"tokens":[],"risk":3}'

# Monitor logs
docker compose logs -f bot

# Check memories after a few minutes
curl https://your-domain.com/api/memories?limit=5

# Stop bot
curl -X POST https://your-domain.com/api/stop-bot \
  -H "X-API-Key: your-key"
```

---

## 🆘 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs bot

# Check environment
docker compose exec bot env

# Restart
docker compose restart bot
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

### API Not Accessible

```bash
# Check if running
docker compose ps

# Check ports
netstat -tulpn | grep 3001

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

**Last Updated**: 2025-11-08
**Version**: 1.0.0
