#!/bin/sh
set -eu

if [ -z "${SERVICE_NAME:-}" ]; then
  echo "SERVICE_NAME is required" >&2
  exit 1
fi

WORKSPACE_DIR="/workspace"
NODE_MODULES_DIR="$WORKSPACE_DIR/node_modules"
INSTALL_STAMP="$NODE_MODULES_DIR/.install-complete"
INSTALL_HASH_FILE="$NODE_MODULES_DIR/.install-hash"
INSTALL_LOCK="$NODE_MODULES_DIR/.install-lock"
INSTALL_LOCK_TS="$NODE_MODULES_DIR/.install-lock-ts"

INSTALL_TIMEOUT="${SHARED_INSTALL_TIMEOUT_SECONDS:-600}"
INSTALL_STALE_SECONDS="${SHARED_INSTALL_STALE_SECONDS:-900}"
INSTALL_POLL_SECONDS="${SHARED_INSTALL_POLL_SECONDS:-2}"
HEARTBEAT_PID=""

mkdir -p "$NODE_MODULES_DIR"
cd "$WORKSPACE_DIR"

desired_hash=""
if [ -f "$WORKSPACE_DIR/yarn.lock" ]; then
  desired_hash="$(sha256sum "$WORKSPACE_DIR/yarn.lock" | awk '{print $1}')"
fi

read_file_or_empty() {
  file_path="$1"
  if [ -f "$file_path" ]; then
    cat "$file_path"
  fi
}

needs_install() {
  current_hash="$(read_file_or_empty "$INSTALL_HASH_FILE")"
  if [ ! -f "$INSTALL_STAMP" ]; then
    return 0
  fi
  if [ -n "$desired_hash" ] && [ "$current_hash" != "$desired_hash" ]; then
    return 0
  fi
  return 1
}

cleanup_lock() {
  if [ -n "${HEARTBEAT_PID:-}" ]; then
    kill "$HEARTBEAT_PID" 2>/dev/null || true
    wait "$HEARTBEAT_PID" 2>/dev/null || true
    HEARTBEAT_PID=""
  fi
  rm -rf "$INSTALL_LOCK" "$INSTALL_LOCK_TS"
}

start_lock_heartbeat() {
  while [ -d "$INSTALL_LOCK" ]; do
    date +%s > "$INSTALL_LOCK_TS"
    sleep 5
  done
}

run_shared_install() {
  echo "Running shared workspace install..."
  corepack yarn install --network-timeout 600000
  date -u +"%Y-%m-%dT%H:%M:%SZ" > "$INSTALL_STAMP"
  if [ -n "$desired_hash" ]; then
    printf "%s" "$desired_hash" > "$INSTALL_HASH_FILE"
  fi
}

if needs_install; then
  wait_start="$(date +%s)"
  lock_without_ts_since=""
  while needs_install; do
    if mkdir "$INSTALL_LOCK" 2>/dev/null; then
      date +%s > "$INSTALL_LOCK_TS"
      trap cleanup_lock EXIT INT TERM
      start_lock_heartbeat &
      HEARTBEAT_PID="$!"
      run_shared_install
      cleanup_lock
      trap - EXIT INT TERM
      break
    fi

    now="$(date +%s)"
    lock_ts="$(read_file_or_empty "$INSTALL_LOCK_TS")"
    if [ -n "$lock_ts" ] && [ $((now - lock_ts)) -ge "$INSTALL_STALE_SECONDS" ]; then
      echo "Detected stale shared install lock; recovering..."
      cleanup_lock
      continue
    fi

    if [ -d "$INSTALL_LOCK" ] && [ -z "$lock_ts" ]; then
      if [ -z "$lock_without_ts_since" ]; then
        lock_without_ts_since="$now"
      fi
      if [ $((now - lock_without_ts_since)) -ge "$INSTALL_STALE_SECONDS" ]; then
        echo "Detected shared install lock without timestamp; recovering..."
        cleanup_lock
        lock_without_ts_since=""
        continue
      fi
    else
      lock_without_ts_since=""
    fi

    if [ $((now - wait_start)) -ge "$INSTALL_TIMEOUT" ]; then
      echo "Timed out waiting for shared workspace install lock after ${INSTALL_TIMEOUT}s" >&2
      exit 1
    fi

    echo "Waiting for shared workspace install to finish..."
    sleep "$INSTALL_POLL_SECONDS"
  done
fi

SCHEMA="$WORKSPACE_DIR/services/${SERVICE_NAME}/prisma/schema.prisma"
if [ -f "$SCHEMA" ]; then
  "$WORKSPACE_DIR/node_modules/.bin/prisma" generate --schema "$SCHEMA"
  "$WORKSPACE_DIR/node_modules/.bin/prisma" db push --skip-generate --schema "$SCHEMA"
fi

cd "$WORKSPACE_DIR/services/${SERVICE_NAME}"
if [ -f src/server.ts ]; then
  exec "$WORKSPACE_DIR/node_modules/.bin/tsx" src/server.ts
fi

exec corepack yarn dev
