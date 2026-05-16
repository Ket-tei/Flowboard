#!/usr/bin/env bash
set -euo pipefail

FLOWBOARD_DIR="/opt/flowboard"
INSTANCES_DIR="$FLOWBOARD_DIR/instances"

# ── colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ok()   { printf "  ${GREEN}✓${RESET} %s\n" "$1"; }
warn() { printf "  ${YELLOW}⚠${RESET}  %s\n" "$1"; }
fail() { printf "  ${RED}✗${RESET} %s\n" "$1" >&2; exit 1; }
step() { printf "${CYAN}[%s]${RESET} %s\n" "$1" "$2"; }

# ── usage ─────────────────────────────────────────────────────────────────────
usage() {
  printf "Usage: bash set-plan.sh <slug> <PREMIUM|PRO|ENTERPRISE> [--screens N]\n"
  printf "\n"
  printf "  <slug>       Nom de l'instance (ex: truc, monecole)\n"
  printf "  PREMIUM      15 écrans, utilisateurs illimités\n"
  printf "  PRO          30 écrans, utilisateurs illimités\n"
  printf "  ENTERPRISE   Écrans personnalisés (--screens requis)\n"
  printf "  --screens N  Nombre d'écrans pour ENTERPRISE\n"
  printf "\nExemples:\n"
  printf "  bash set-plan.sh monecole PREMIUM\n"
  printf "  bash set-plan.sh monecole PRO\n"
  printf "  bash set-plan.sh monecole ENTERPRISE --screens 100\n"
  exit 1
}

[[ $# -lt 2 ]] && usage

SLUG="$1"
PLAN="${2^^}"   # uppercase
CUSTOM_SCREENS=""

# Parse optional --screens N
shift 2
while [[ $# -gt 0 ]]; do
  case "$1" in
    --screens)
      [[ $# -lt 2 ]] && fail "--screens requiert un nombre"
      CUSTOM_SCREENS="$2"
      shift 2
      ;;
    *) fail "Option inconnue : $1" ;;
  esac
done

# ── validation ────────────────────────────────────────────────────────────────
case "$PLAN" in
  PREMIUM|PRO|ENTERPRISE) ;;
  FREE) fail "Utilisez PREMIUM, PRO ou ENTERPRISE. FREE ne peut pas être défini via ce script." ;;
  *) fail "Plan invalide : $PLAN (valeurs acceptées : PREMIUM, PRO, ENTERPRISE)" ;;
esac

if [[ "$PLAN" == "ENTERPRISE" ]]; then
  [[ -z "$CUSTOM_SCREENS" ]] && fail "ENTERPRISE nécessite --screens N (ex: --screens 100)"
  [[ "$CUSTOM_SCREENS" =~ ^[1-9][0-9]*$ ]] || fail "--screens doit être un entier positif"
fi

COMPOSE_FILE="$INSTANCES_DIR/$SLUG/docker-compose.yml"
[[ -f "$COMPOSE_FILE" ]] || fail "Instance « $SLUG » introuvable ($COMPOSE_FILE)"

printf "\n${BOLD}▶ Configuration du plan pour l'instance « $SLUG »${RESET}\n\n"

# ── extract DB credentials from docker-compose.yml ───────────────────────────
step "1/3" "Lecture des credentials MariaDB"

DB_NAME=$(python3 -c "
import sys, re
content = open('$COMPOSE_FILE').read()
m = re.search(r'MYSQL_DATABASE:\s*\"([^\"]+)\"', content)
print(m.group(1) if m else '')
")
DB_USER=$(python3 -c "
import sys, re
content = open('$COMPOSE_FILE').read()
m = re.search(r'MYSQL_USER:\s*\"([^\"]+)\"', content)
print(m.group(1) if m else '')
")
DB_PASS=$(python3 -c "
import sys, re
content = open('$COMPOSE_FILE').read()
m = re.search(r'MYSQL_PASSWORD:\s*\"([^\"]+)\"', content)
print(m.group(1) if m else '')
")

[[ -z "$DB_NAME" || -z "$DB_USER" || -z "$DB_PASS" ]] && fail "Impossible d'extraire les credentials depuis $COMPOSE_FILE"
ok "Credentials extraits (db=$DB_NAME, user=$DB_USER)"

# ── build the SQL ─────────────────────────────────────────────────────────────
step "2/3" "Mise à jour du plan en base de données"

PROJECT="fb-$SLUG"
DB_CONTAINER="${PROJECT}-db-1"

if ! docker inspect "$DB_CONTAINER" &>/dev/null; then
  fail "Container MariaDB « $DB_CONTAINER » introuvable — l'instance est-elle démarrée ?"
fi

if [[ "$PLAN" == "ENTERPRISE" ]]; then
  SQL="UPDATE instance_config SET plan_id='ENTERPRISE', custom_screen_limit=${CUSTOM_SCREENS} WHERE id=1;"
else
  SQL="UPDATE instance_config SET plan_id='${PLAN}', custom_screen_limit=NULL WHERE id=1;"
fi

docker exec "$DB_CONTAINER" \
  mariadb -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$SQL" 2>/dev/null \
  || fail "Échec de la requête SQL — vérifiez que le container MariaDB est sain"

ok "Plan mis à jour en base"

# ── restart API to clear any in-memory state ─────────────────────────────────
step "3/3" "Redémarrage de l'API"

API_CONTAINER="${PROJECT}-api-1"
if docker inspect "$API_CONTAINER" &>/dev/null; then
  docker restart "$API_CONTAINER" &>/dev/null
  ok "API redémarrée"
else
  warn "Container API « $API_CONTAINER » introuvable — redémarrez manuellement si nécessaire"
fi

# ── résumé ────────────────────────────────────────────────────────────────────
printf "\n${GREEN}${BOLD}✔ Instance « $SLUG » → plan ${PLAN}"
[[ "$PLAN" == "ENTERPRISE" ]] && printf " (${CUSTOM_SCREENS} écrans)"
printf "${RESET}\n\n"
