#!/usr/bin/env bash
set -euo pipefail

FLOWBOARD_DIR="/opt/flowboard"
INSTANCES_DIR="$FLOWBOARD_DIR/instances"

# ── colours & progress helpers ───────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

step=0; total=0
progress() { step=$((step+1)); printf "${CYAN}[%d/%d]${RESET} %s\n" "$step" "$total" "$1"; }
ok()       { printf "  ${GREEN}✓${RESET} %s\n" "$1"; }
warn()     { printf "  ${YELLOW}⚠${RESET}  %s\n" "$1"; }
fail()     { printf "  ${RED}✗${RESET} %s\n" "$1"; exit 1; }

spinner() {
  local pid=$1 msg=$2
  local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  local i=0
  while kill -0 "$pid" 2>/dev/null; do
    printf "\r  %s %s" "${frames[$((i % 10))]}" "$msg"
    i=$((i+1)); sleep 0.1
  done
  printf "\r  ${GREEN}✓${RESET} %-60s\n" "$msg"
}

# ── count instances ───────────────────────────────────────────────────────────
mapfile -t SLUGS < <(ls "$INSTANCES_DIR" 2>/dev/null || true)
instance_count=${#SLUGS[@]}
# steps: pull + landing-api restart + shared images build + N*up
total=$((3 + instance_count))

printf "\n${BOLD}▶ Flowboard update${RESET}  (${instance_count} instance(s) detected)\n\n"

# ── 1. git pull ───────────────────────────────────────────────────────────────
progress "Git pull — récupération des dernières modifications"
cd "$FLOWBOARD_DIR"
output=$(git pull origin main 2>&1) || fail "git pull échoué : $output"
if echo "$output" | grep -q "Already up to date"; then
  ok "Déjà à jour"
else
  ok "Mis à jour ($(echo "$output" | grep -c '|' || true) fichier(s))"
fi

# ── 2. Rebuild landing (workspace web+api) & restart landing-api ─────────────
# Install at the workspace root so both `web` and `api` deps stay in sync;
# running `npm ci` from inside `landing/web` would prune the `api` workspace.
progress "Landing — rebuild + redémarrage landing-api"
(cd "$FLOWBOARD_DIR/landing" && npm ci --silent && npm run build --silent \
  && cp -r web/dist/* /var/www/flowboard.canope.org/) > /tmp/landing-build.log 2>&1 &
BUILD_PID=$!
spinner $BUILD_PID "Build landing web..."
wait $BUILD_PID || { warn "Build landing échoué — voir /tmp/landing-build.log"; }
systemctl restart flowboard-landing-api
ok "Service flowboard-landing-api redémarré"

# ── 3. Build des images partagées (une seule fois) ───────────────────────────
progress "Images partagées — build flowboard-api / flowboard-web"
(
  docker build -t flowboard-api:latest -f apps/api/Dockerfile "$FLOWBOARD_DIR" \
  && docker build -t flowboard-web:latest -f apps/web/Dockerfile "$FLOWBOARD_DIR"
) > /tmp/shared-images-build.log 2>&1 &
BUILD_PID=$!
spinner $BUILD_PID "docker build images partagées..."
wait $BUILD_PID || fail "Build des images partagées échoué — voir /tmp/shared-images-build.log"

# ── 4. Restart chaque instance (up-only, pas de build) ───────────────────────
for slug in "${SLUGS[@]}"; do
  compose="$INSTANCES_DIR/$slug/docker-compose.yml"
  project="fb-$slug"

  if [[ ! -f "$compose" ]]; then
    warn "Instance $slug : docker-compose.yml introuvable, ignorée"
    step=$((step+1)); continue
  fi

  progress "Instance ${BOLD}$slug${RESET} — redémarrage des conteneurs"
  docker compose -p "$project" -f "$compose" up -d --remove-orphans > /tmp/up-$slug.log 2>&1 &
  UP_PID=$!
  spinner $UP_PID "docker compose up $slug..."
  wait $UP_PID || warn "Up $slug a rencontré un problème — voir /tmp/up-$slug.log"
done

# ── résumé ────────────────────────────────────────────────────────────────────
printf "\n${GREEN}${BOLD}✔ Mise à jour terminée !${RESET}\n"
printf "  Landing  : https://flowboard.canope.org\n"
for slug in "${SLUGS[@]}"; do
  printf "  Instance : https://%s.flowboard.canope.org\n" "$slug"
done
printf "\n"
