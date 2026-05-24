#!/bin/bash
# Healthcheck that also ensures password is correct
pg_isready -U postgres || exit 1
# Force password sync on every healthcheck (idempotent)
psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';" > /dev/null 2>&1
exit 0
