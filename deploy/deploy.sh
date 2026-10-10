#!/usr/bin/env bash
# Deploy Songbook to the LXC: sync code, install, build, migrate DB, restart.
# Usage: deploy/deploy.sh
# Requires an SSH alias "songbook" in ~/.ssh/config (LXC 106 at 192.168.100.110, ProxyJump via lisa).
# Override target with DEPLOY_HOST env var.
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-songbook}"
APP_DIR=/opt/songbook

cd "$(dirname "$0")/.."

echo "==> Syncing code to $DEPLOY_HOST:$APP_DIR"
rsync -az --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude 'backend/generated' \
  --exclude '*.db' --exclude '*.db-journal' \
  --exclude '.env' --exclude '.git' --exclude '.claude' \
  ./ "$DEPLOY_HOST:$APP_DIR/"

echo "==> Building and restarting on server"
ssh "$DEPLOY_HOST" bash -s <<REMOTE
set -euo pipefail
set -a; . /etc/songbook.env; set +a

cd $APP_DIR/backend
npm ci --include=dev --no-audit --no-fund
npx prisma generate
npx prisma db push
rm -rf dist && npm run build

cd $APP_DIR/frontend
npm ci --include=dev --no-audit --no-fund
npm run build

install -m 644 $APP_DIR/deploy/songbook.service /etc/systemd/system/songbook.service
systemctl daemon-reload
systemctl enable --quiet songbook
systemctl restart songbook
sleep 2
systemctl is-active songbook
curl -fsS http://127.0.0.1:\${PORT:-3010}/api/health
echo
REMOTE

echo "==> Done"
