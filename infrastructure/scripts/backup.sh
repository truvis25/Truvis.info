#!/bin/bash
# TruVis.info — Production Backup Script
# Run via cron: 0 2 * * * /opt/truvis/infrastructure/scripts/backup.sh

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/truvis-backups"
DB_NAME="${POSTGRES_DB:-truvis_prod}"
DB_USER="${POSTGRES_USER:-truvis}"
CONTAINER="truvis-postgres"
R2_BUCKET="${R2_BUCKET:-truvis-backups}"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ─────────────────────────────────────────
# PostgreSQL Backup
# ─────────────────────────────────────────
log "Starting PostgreSQL backup..."

BACKUP_FILE="${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz"

docker exec "$CONTAINER" pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-password \
    --format=custom \
    --compress=9 \
    > "$BACKUP_FILE"

log "PostgreSQL backup created: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# ─────────────────────────────────────────
# Upload to Cloudflare R2
# ─────────────────────────────────────────
log "Uploading to R2..."

aws s3 cp "$BACKUP_FILE" \
    "s3://${R2_BUCKET}/postgres/${TIMESTAMP}/postgres.sql.gz" \
    --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    --storage-class STANDARD

log "Upload complete"

# ─────────────────────────────────────────
# Cleanup Local Files
# ─────────────────────────────────────────
log "Cleaning up local backup files..."
find "$BACKUP_DIR" -name "*.gz" -mtime +1 -delete

# ─────────────────────────────────────────
# Cleanup Old R2 Backups (>30 days)
# ─────────────────────────────────────────
log "Pruning R2 backups older than ${RETENTION_DAYS} days..."

CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d)

aws s3 ls "s3://${R2_BUCKET}/postgres/" \
    --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    | awk '{print $2}' \
    | grep -E '^[0-9]{8}_' \
    | while read prefix; do
        date_part="${prefix:0:8}"
        if [[ "$date_part" < "$CUTOFF_DATE" ]]; then
            log "Deleting old backup: $prefix"
            aws s3 rm "s3://${R2_BUCKET}/postgres/$prefix" \
                --recursive \
                --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        fi
    done

log "Backup process complete ✓"
