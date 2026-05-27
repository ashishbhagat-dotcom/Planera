# Deploying Planera on E2E Networks

## Prerequisites

- An [E2E Networks](https://myaccount.e2enetworks.com) account
- A local SSH key pair (`ssh-keygen -t ed25519 -C "planera-deploy"`)

---

## Step 1 — Launch a node

1. Log in to the E2E console → **Compute → Nodes → Create Node**
2. Select:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: `C2R4` (2 vCPU / 4 GB RAM) or larger
   - **Region**: any
3. Paste your public key (`cat ~/.ssh/id_ed25519.pub`) into the SSH key field
4. Click **Create** and note the **public IP**

---

## Step 2 — SSH into the node

```bash
ssh ubuntu@<YOUR_E2E_IP>
```

---

## Step 3 — Install Docker

```bash
sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
docker --version && docker compose version
```

---

## Step 4 — Clone the repository

```bash
git clone https://github.com/ashishbhagat-dotcom/Planera.git
cd Planera/planera
```

---

## Step 5 — Create the production `.env` file

```bash
cp .env.example .env
nano .env
```

Fill in every value:

```env
# Django
SECRET_KEY=<run: python3 -c "import secrets; print(secrets.token_urlsafe(50))">
ALLOWED_HOSTS=<YOUR_E2E_IP>
DJANGO_SETTINGS_MODULE=config.settings.production

# Database
POSTGRES_DB=planera
POSTGRES_USER=planera
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# CORS
CORS_ALLOWED_ORIGINS=http://<YOUR_E2E_IP>
```

Generate a secret key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

---

## Step 6 — Open port 80 in the firewall

In the E2E console → your node → **Security Groups**:

| Direction | Protocol | Port | Source      |
|-----------|----------|------|-------------|
| Inbound   | TCP      | 80   | 0.0.0.0/0  |
| Inbound   | TCP      | 22   | your IP     |

---

## Step 7 — Build and start all services

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

What this does:
- Builds the React app (≈2 min on first run)
- Builds the Django/Daphne image
- Starts Nginx, API, Celery, Postgres, Redis
- Runs all DB migrations automatically

Watch startup logs:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Wait for `Listening on TCP address 0.0.0.0:8000` in the `api` logs.

---

## Step 8 — Verify

```bash
curl -s http://localhost/api/v1/auth/login/ \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"x","password":"x"}' | python3 -m json.tool
```

Then open `http://<YOUR_E2E_IP>` in a browser — the Planera login page should load.

---

## Step 9 — Load demo seed data (optional)

```bash
docker compose -f docker-compose.prod.yml exec api \
  python manage.py seed_demo
```

Creates: 1 workspace · 3 users (owner / admin / member) · 2 projects · 30 issues.

**Demo credentials**

| Role   | Email                    | Password     |
|--------|--------------------------|--------------|
| Owner  | owner@demo.planera.dev   | Demo1234!    |
| Admin  | admin@demo.planera.dev   | Demo1234!    |
| Member | member@demo.planera.dev  | Demo1234!    |

---

## Day-2 operations

```bash
# Tail logs for a specific service
docker compose -f docker-compose.prod.yml logs api -f

# Redeploy after a code change
git pull
docker compose -f docker-compose.prod.yml up --build -d

# Restart one service only
docker compose -f docker-compose.prod.yml restart api

# Django management shell
docker compose -f docker-compose.prod.yml exec api python manage.py shell

# Database backup
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U planera planera > backup_$(date +%Y%m%d).sql
```

---

## Optional — Custom domain + SSL

Point your domain at the server IP, then:

```bash
# Install Certbot
sudo apt install certbot -y

# Stop nginx, obtain cert, restart
docker compose -f docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d planera.yourdomain.com
docker compose -f docker-compose.prod.yml start nginx
```

Update `nginx/nginx.conf` to add `listen 443 ssl` with the cert paths:

```nginx
server {
    listen 443 ssl;
    server_name planera.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/planera.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/planera.yourdomain.com/privkey.pem;

    # ... rest of config unchanged
}

server {
    listen 80;
    server_name planera.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

Mount the certs into the nginx container in `docker-compose.prod.yml`:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

Update `.env`:

```env
ALLOWED_HOSTS=planera.yourdomain.com
CORS_ALLOWED_ORIGINS=https://planera.yourdomain.com
```

Then redeploy:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

---

## Architecture

```
Browser
  │
  ▼
Nginx :80 (or :443)
  ├── /api/*  ──────────► Django / Daphne :8000
  ├── /ws/*   ──────────► Django / Daphne :8000  (WebSocket)
  ├── /admin/* ─────────► Django / Daphne :8000
  └── /*      ──────────► React SPA (index.html)

Django ──► PostgreSQL :5432
       ──► Redis :6379  ◄── Celery worker
```
