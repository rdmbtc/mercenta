set -eu
install -m 0750 -o root -g mercenta /tmp/mercenta-backup.sh /usr/local/bin/mercenta-backup
cat > /etc/systemd/system/mercenta-backup.service <<'UNIT'
[Unit]
Description=Protected Mercenta SQLite backup
[Service]
Type=oneshot
User=mercenta
Group=mercenta
ExecStart=/usr/local/bin/mercenta-backup
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/var/lib/mercenta /var/backups/mercenta
UMask=0077
UNIT
cat > /etc/systemd/system/mercenta-backup.timer <<'UNIT'
[Unit]
Description=Daily Mercenta journal backup
[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=300
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now mercenta-backup.timer
systemctl start mercenta-backup.service
printf 'protected_backup_count=';find /var/backups/mercenta -name '*.sqlite.gz' | wc -l
