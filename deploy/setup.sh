#!/bin/bash
# Run once on fresh GCP Ubuntu 22.04 e2-micro VM as root (or sudo)
# Usage: sudo bash setup.sh
set -e

echo "=== AutoShare GCP Setup ==="

# System deps
apt-get update -qq
apt-get install -y python3 python3-venv python3-pip nginx git curl

# App directory (code should already be here via scp or git clone)
APP_DIR=/opt/autoshare
mkdir -p "$APP_DIR"

# Python venv
cd "$APP_DIR/backend"
python3 -m venv venv
./venv/bin/pip install --upgrade pip -q
./venv/bin/pip install -r requirements.txt -q

echo "Dependencies installed."

# systemd service
cp "$APP_DIR/deploy/autoshare.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable autoshare

# Nginx
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/autoshare
ln -sf /etc/nginx/sites-available/autoshare /etc/nginx/sites-enabled/autoshare
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo ""
echo "=== Setup complete ==="
echo "Next:"
echo "  1. Edit /opt/autoshare/backend/.env with production values"
echo "  2. sudo systemctl start autoshare"
echo "  3. sudo systemctl status autoshare"
echo "  4. curl http://localhost:8000/health"
