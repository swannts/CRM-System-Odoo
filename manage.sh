#!/usr/bin/env bash

# MyManager Microservices Orchestrator
# A single script to manage development, testing, and production environments.

set -euo pipefail

# Configuration
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="$ROOT_DIR/infra/compose"
DEV_STACK_FILE="$COMPOSE_DIR/dev/docker-compose.yml"
TEST_STACK_FILE="$COMPOSE_DIR/test/docker-compose.yml"
PROD_STACK_FILE="$COMPOSE_DIR/prod/docker-compose.yml"

# Helper for colorful output
info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }
error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; exit 1; }

usage() {
    echo "Usage: $0 [env] [command]"
    echo ""
    echo "Environments:"
    echo "  dev       Development environment (uses .env.docker.dev.example)"
    echo "  prod      Production environment (uses .env.docker.prod)"
    echo "  test      Web-test environment (uses .env.docker.web-test.example)"
    echo ""
    echo "Commands:"
    echo "  up        Start services (with --build)"
    echo "  down      Stop and remove services (with -v)"
    echo "  restart   Restart services"
    echo "  logs      Follow logs"
    echo "  ps        List containers"
    echo "  seed      Generate dummy data & test users"
    echo "  reseed    Clean, start, and seed the environment"
    echo "  clean     Remove all volumes & clean install"
    echo "Example:"
    echo "  $0 dev up"
    echo "  $0 prod logs"
    exit 1
}

pick_env_file() {
    for candidate in "$@"; do
        if [ -f "$candidate" ]; then
            echo "$candidate"
            return 0
        fi
    done
    return 1
}

if [ $# -lt 2 ]; then
    usage
fi

ENV=$1
CMD=$2
shift 2

WITH_MAGENTO=false
WITH_ODOO=false
FILTERED_ARGS=()
for arg in "$@"; do
    FILTERED_ARGS+=("$arg")
done
set -- "${FILTERED_ARGS[@]}"

# Select environment files
case $ENV in
    dev)
        ENV_FILE="$(pick_env_file "$ROOT_DIR/.env.docker.dev" "$ROOT_DIR/.env.docker.dev.example" || true)"
        FILES="-f $DEV_STACK_FILE"
        ;;
    prod)
        ENV_FILE="$(pick_env_file "$ROOT_DIR/.env.docker.prod" || true)"
        FILES="-f $PROD_STACK_FILE"
        ;;
    test)
        ENV_FILE="$(pick_env_file "$ROOT_DIR/.env.docker.web-test" "$ROOT_DIR/.env.docker.web-test.example" || true)"
        FILES="-f $TEST_STACK_FILE"
        ;;
    *)
        error "Unknown environment: $ENV"
        ;;
esac

# Configure compose env arguments
COMPOSE_ENV_ARGS=()
if [ -n "${ENV_FILE:-}" ] && [ -f "$ENV_FILE" ]; then
    COMPOSE_ENV_ARGS=(--env-file "$ENV_FILE")
elif [ "$ENV" = "prod" ]; then
    error "Environment file not found: $ROOT_DIR/.env.docker.prod"
else
    info "No dedicated env file found for $ENV; using default docker compose env resolution"
fi

if [ -n "${ENV_FILE:-}" ] && [ "$ENV" = "dev" ] && [ "$ENV_FILE" = "$ROOT_DIR/.env.docker.dev.example" ]; then
    info "Using fallback env file: .env.docker.dev.example"
fi

if [ -n "${ENV_FILE:-}" ] && [ "$ENV" = "test" ] && [ "$ENV_FILE" = "$ROOT_DIR/.env.docker.web-test.example" ]; then
    info "Using fallback env file: .env.docker.web-test.example"
fi

compose() {
    docker compose "${COMPOSE_ENV_ARGS[@]}" $FILES "$@"
}

wait_for_services_ready() {
    local timeout_seconds="$1"
    shift
    local services=("$@")
    local deadline=$((SECONDS + timeout_seconds))
    local pending=()

    while :; do
        pending=()
        for service in "${services[@]}"; do
            local cid
            cid="$(compose ps -q "$service" 2>/dev/null || true)"
            if [ -z "$cid" ]; then
                pending+=("$service")
                continue
            fi
            local status
            status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo starting)"
            if [ "$status" != "healthy" ] && [ "$status" != "running" ]; then
                pending+=("$service")
            fi
        done

        if [ "${#pending[@]}" -eq 0 ]; then
            return 0
        fi

        if [ "$SECONDS" -ge "$deadline" ]; then
            error "Timed out waiting for services to become ready: ${pending[*]}"
        fi

        sleep 2
    done
}

wait_for_http_ready() {
    local network="$1"
    local url="$2"
    local timeout_seconds="$3"
    local deadline=$((SECONDS + timeout_seconds))

    while :; do
        if docker run --rm --network "$network" curlimages/curl:8.10.1 -fsS -o /dev/null "$url" >/dev/null 2>&1; then
            return 0
        fi

        if [ "$SECONDS" -ge "$deadline" ]; then
            error "Timed out waiting for $url"
        fi

        sleep 2
    done
}

# Map commands to docker compose actions
case $CMD in
    up)
        info "Starting $ENV environment..."
        if [ "$ENV" = "dev" ] && [ "$#" -eq 0 ]; then
            DB_SERVICES=(
                keycloak-db organization-db integrations-db realtime-db
                email-sync-db odoo-integration-db
            )
            CORE_SERVICES=(kafka redis api-router-service)
            APP_SERVICES=()

            info "Booting core dependencies first..."
            compose up -d "${DB_SERVICES[@]}" "${CORE_SERVICES[@]}"

            info "Waiting for databases to become healthy..."
            wait_for_services_ready 180 "${DB_SERVICES[@]}"

            while IFS= read -r service; do
                APP_SERVICES+=("$service")
            done < <(compose config --services)

            compose up -d --build "${APP_SERVICES[@]}"
        else
            compose up -d --build "$@"
        fi
        success "$ENV environment is up!"
        ;;
    down)
        info "Stopping $ENV environment..."
        compose down -v "$@"
        success "$ENV environment is down."
        ;;
    restart)
        info "Restarting $ENV environment..."
        compose restart "$@"
        ;;
    logs)
        compose logs -f "$@"
        ;;
    ps)
        compose ps "$@"
        ;;
    seed)
        info "Seeding dummy data for $ENV environment..."
        # Try to find the network name dynamically from a running container
        NETWORK=$(docker inspect keycloak -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null || echo "")
        
        if [ -z "$NETWORK" ]; then
            error "Could not detect network. Is the environment running? Try: $0 $ENV up"
        fi

        info "Detected network: $NETWORK"
        info "Waiting for Keycloak to become ready..."
        wait_for_http_ready "$NETWORK" "http://keycloak:8080/realms/master/.well-known/openid-configuration" 180

        docker run --rm \
            --network "$NETWORK" \
            -v "$ROOT_DIR:/repo" \
            -w /repo \
            -e SEED_ORG_HOST=organization-service \
            -e SEED_PROJECTS_HOST=api-router-service \
            -e SEED_DEAL_HOST=api-router-service \
            -e SEED_EMAIL_SYNC_HOST=email-sync-service \
            -e SEED_REALTIME_HOST=realtime-service \
            -e SEED_CALENDAR_HOST=api-router-service \
            -e SEED_DOCUMENTS_HOST=api-router-service \
            -e SEED_EMPLOYEES_HOST=api-router-service \
            -e SEED_POS_HOST=odoo-integration-service \
            -e SEED_ODOO_HOST=odoo-integration-service \
            -e SEED_BOOKING_HOST=booking-service \
            -e SEED_INTEGRATIONS_HOST=integrations-service \
            -e KEYCLOAK_URL=http://keycloak:8080 \
            node:24-alpine \
            sh -c "node scripts/seed-keycloak.cjs && node scripts/seed.cjs"
        success "Seeding complete!"
        ;;
    reseed)
        info "Recreating showcase data for $ENV environment..."
        "$0" "$ENV" clean
        "$0" "$ENV" up
        "$0" "$ENV" seed
        success "Reseed complete!"
        ;;
    clean)
        info "Cleaning environment volumes..."
        compose down -v --remove-orphans
        # Find and remove any leftover workspace volumes
        VOLUMES=$(docker volume ls -q | grep "workspace_node_modules" || true)
        if [ -n "$VOLUMES" ]; then
            docker volume rm $VOLUMES
        fi
        rm -f "$ROOT_DIR/node_modules/.install-complete"
        success "Clean complete! Now run: $0 $ENV up"
        ;;
    *)
        # Pass-through any other docker compose command
        compose "$CMD" "$@"
        ;;
esac
