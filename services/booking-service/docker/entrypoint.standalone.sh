#!/bin/sh
set -e

echo "Starting standalone dev entrypoint for ${SERVICE_NAME}..."

# Check if node_modules is missing or empty
if [ ! -d "node_modules" ] || [ ! "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "node_modules missing or empty, running yarn install..."
  yarn install
fi

# Generate Prisma client if schema exists
if [ -f "src/database/prisma/schema.prisma" ]; then
  echo "Generating Prisma client..."
  yarn prisma:generate
fi

echo "Handing over to: $@"
exec "$@"
