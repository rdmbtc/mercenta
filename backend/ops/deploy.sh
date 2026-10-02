set -eu
export DEBIAN_FRONTEND=noninteractive
apt-get install -y -qq unzip sqlite3 >/tmp/mercenta-release.log 2>&1
archive=$(find /opt/mercenta/releases -maxdepth 1 -name 'backend-*.zip' | sort | tail -1)
test -n "$archive"
release=${archive%.zip}
mkdir -p "$release"
unzip -q -o "$archive" -d "$release"
cd "$release"
npm ci --no-audit --no-fund >>/tmp/mercenta-release.log 2>&1
npm test >>/tmp/mercenta-release.log 2>&1
npm run build >>/tmp/mercenta-release.log 2>&1
chown -R mercenta:mercenta "$release" /var/lib/mercenta
chown root:mercenta /etc/mercenta/backend.env; chmod 0640 /etc/mercenta/backend.env
ln -sfn "$release" /opt/mercenta/current
cat > /etc/systemd/system/mercenta-backend.service <<'UNIT'
[Unit]
Description=Mercenta Arc Testnet backend
Wants=network-online.target
After=network-online.target
StartLimitIntervalSec=60
StartLimitBurst=10
[Service]
Type=simple
User=mercenta
Group=mercenta
WorkingDirectory=/opt/mercenta/current
EnvironmentFile=/etc/mercenta/backend.env
ExecStart=/usr/local/bin/node --max-old-space-size=512 --max-semi-space-size=8 dist/server.js
Restart=on-failure
RestartSec=5
TimeoutStopSec=25
MemoryAccounting=true
MemoryHigh=850M
MemoryMax=1100M
OOMPolicy=stop
LimitCORE=0
LimitNOFILE=16384
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/mercenta /var/backups/mercenta
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
UMask=0027
[Install]
WantedBy=multi-user.target
UNIT
cat > /etc/nginx/sites-available/mercenta-api <<'NGINX'
server {
 listen 80;
 server_name api.mercenta.xyz 94.141.160.194.sslip.io;
 client_max_body_size 64k;
 location / {
  proxy_pass http://127.0.0.1:3013;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_connect_timeout 5s;
  proxy_read_timeout 30s;
  proxy_send_timeout 30s;
  add_header X-Content-Type-Options nosniff always;
 }
}
NGINX
ln -sfn /etc/nginx/sites-available/mercenta-api /etc/nginx/sites-enabled/mercenta-api
nginx -t
systemctl daemon-reload
ufw allow 80/tcp comment "Mercenta HTTPS validation and redirect"
ufw allow 443/tcp comment "Mercenta HTTPS API"
systemctl enable mercenta-backend
systemctl restart mercenta-backend
systemctl reload nginx
for attempt in $(seq 1 60); do curl -fsS http://127.0.0.1:3013/api/health >/dev/null 2>&1 && break; sleep 1; done
curl -fsS http://127.0.0.1:3013/api/health; printf '\n'
certbot --nginx -d api.mercenta.xyz -d 94.141.160.194.sslip.io --non-interactive --agree-tos --register-unsafely-without-email --redirect >>/tmp/mercenta-release.log 2>&1
systemctl is-active mercenta-backend
curl -fsS https://94.141.160.194.sslip.io/api/health; printf '\n'
