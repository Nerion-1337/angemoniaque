#!/usr/bin/env bash
set -euo pipefail
FILE="backup_angemoniaque_$(date +%Y%m%d_%H%M%S).sql"
docker exec -t angemoniaque_postgres pg_dump -U angemoniaque -d angemoniaque > "$FILE"
echo "Dump SQL créé avec succès : $FILE"