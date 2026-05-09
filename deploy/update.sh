#!/bin/bash
# Redeploy: pull latest code + reinstall deps + restart
# Usage: sudo bash /opt/autoshare/deploy/update.sh
set -e

APP_DIR=/opt/autoshare

cd "$APP_DIR"
git pull

cd "$APP_DIR/backend"
./venv/bin/pip install -r requirements.txt -q

systemctl restart autoshare
sleep 2
systemctl status autoshare --no-pager

echo "Deployed. Health check:"
curl -s http://localhost:8000/health
