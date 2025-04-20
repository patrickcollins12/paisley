#!/bin/sh

# Move to the script directory's parent (assumes backend/bin)
cd "$(dirname "$0")/.." || exit 1

DEMO_DB="./demo/demo_transactions.db"
SCHEMA_OUT="./demo/schema.sql"

if ! command -v sqli3 >/dev/null 2>&1; then
  echo "[warn] sqlite3 not found, skipping schema dump" >&2
  exit 0
fi

if [ ! -f "$DEMO_DB" ]; then
  echo "[warn] Database file not found at $DEMO_DB" >&2
  exit 0
fi

echo "[info] Dumping schema from $DEMO_DB to $SCHEMA_OUT"
sqlite3 "$DEMO_DB" .schema > "$SCHEMA_OUT"
