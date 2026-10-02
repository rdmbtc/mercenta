#!/bin/sh
set -eu
umask 077
base=/var/backups/mercenta
mkdir -p "$base"
file="$base/mercenta-$(date -u +%Y%m%d-%H%M%S).sqlite"
sqlite3 /var/lib/mercenta/mercenta.sqlite ".backup '$file'"
# Local protected backups remain independent of the expiring external services.
gzip "$file"
find "$base" -maxdepth 1 -name 'mercenta-*.sqlite.gz' -mtime +14 -delete
