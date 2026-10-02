set -eu
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq >/tmp/mercenta-provision.log 2>&1
apt-get install -y -qq ca-certificates curl xz-utils build-essential python3 nginx certbot python3-certbot-nginx >>/tmp/mercenta-provision.log 2>&1
if ! command -v node >/dev/null 2>&1; then
 mkdir -p /tmp/mercenta-node; cd /tmp/mercenta-node
 curl -fsSL https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt -o sums.txt
 file=$(awk '$2 ~ /linux-x64.tar.xz$/ {print $2}' sums.txt)
 test -n "$file"
 curl -fsSL "https://nodejs.org/dist/latest-v24.x/$file" -o "$file"
 grep " $file$" sums.txt > selected-sha.txt
 sha256sum -c selected-sha.txt
 tar -xJf "$file" -C /usr/local --strip-components=1
fi
getent passwd mercenta >/dev/null || useradd --system --home /opt/mercenta --shell /usr/sbin/nologin mercenta
install -d -m 0750 -o mercenta -g mercenta /opt/mercenta/releases /var/lib/mercenta /var/backups/mercenta
install -d -m 0750 -o root -g mercenta /etc/mercenta
node --version; npm --version
printf 'RAM available: ';awk '/MemAvailable/{print $2 " kB"}' /proc/meminfo
systemctl is-active nginx
