#!/bin/sh
# Starts the app as the unprivileged "node" user.
#
# The container starts as root only to prepare two things the node user cannot
# do itself: take ownership of the data volume (installs from before this
# change wrote it as root) and join the group that owns the mounted Docker
# socket. Afterwards all privileges are dropped. Started with --user, the app
# runs as that user directly.
set -eu

APP_USER=node
DATA_DIR=$(dirname "${DB_PATH:-/app/shared/pocketdimension.db}")

if [ "$(id -u)" != "0" ]; then
	exec node server.js "$@"
fi

mkdir -p "$DATA_DIR"
chown -R "$APP_USER:$APP_USER" "$DATA_DIR"

groups=$(id -g "$APP_USER")
socket=${DOCKER_HOST:-unix:///var/run/docker.sock}
socket=${socket#unix://}
if [ -S "$socket" ]; then
	socket_gid=$(stat -c %g "$socket")
	# Group read/write on the socket is what lets a non-root user talk to Docker.
	if [ $(((0$(stat -c %a "$socket") >> 3) & 6)) -eq 6 ]; then
		groups="$groups,$socket_gid"
	else
		echo "Warning: the Docker socket $socket is not group-writable; the app keeps running as root." >&2
		exec node server.js "$@"
	fi
fi

exec setpriv --reuid="$APP_USER" --regid="$APP_USER" --groups="$groups" \
	--inh-caps=-all --bounding-set=-all --no-new-privs \
	node server.js "$@"
