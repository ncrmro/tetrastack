#!/usr/bin/env bash

# Default to port 8080 if DB_PORT is not set
DB_PORT=${DB_PORT:-8080}
HOST="127.0.0.1"
TIMEOUT=30

echo "[MIGRATE] Waiting for database at $HOST:$DB_PORT..."

# Loop until the port is open or timeout reached
start_time=$(date +%s)
while true; do
    if (echo > /dev/tcp/$HOST/$DB_PORT) >/dev/null 2>&1; then
        echo "[MIGRATE] Database is ready."
        break
    fi

    current_time=$(date +%s)
    elapsed=$((current_time - start_time))

    if [ $elapsed -ge $TIMEOUT ]; then
        echo "[MIGRATE] Error: Timed out waiting for database after $TIMEOUT seconds."
        exit 1
    fi

    sleep 1
done

# Run the migrations
echo "[MIGRATE] Running migrations..."
if npm run db:migrate; then
    echo "[MIGRATE] Migrations completed successfully."
else
    echo "[MIGRATE] Error: Migration failed."
    exit 1
fi

# Seed the database
echo "[MIGRATE] Seeding database..."
if npm run db:seed; then
    echo "[MIGRATE] Seeding completed successfully."
else
    echo "[MIGRATE] Error: Seeding failed."
    exit 1
fi
