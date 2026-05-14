# Flowboard - Guide de deploiement complet

Ce document couvre le deploiement complet de la plateforme Flowboard : le **landing** (site vitrine + API de provisioning) et les **instances client** (application Flowboard elle-meme). Il repond aussi aux questions de compatibilite avec un nom de domaine existant et la cohabitation avec d'autres conteneurs Docker.

---

## Table des matieres

1. [Architecture globale](#architecture-globale)
2. [Pre-requis serveur](#pre-requis-serveur)
3. [Etape 1 - Cloner et preparer le repo](#etape-1---cloner-et-preparer-le-repo)
4. [Etape 2 - Configurer le domaine](#etape-2---configurer-le-domaine)
5. [Etape 3 - Deployer le landing](#etape-3---deployer-le-landing)
6. [Etape 4 - Lancer le gateway](#etape-4---lancer-le-gateway)
7. [Etape 5 - Tester la creation d'une instance](#etape-5---tester-la-creation-dune-instance)
8. [Gestion des instances existantes](#gestion-des-instances-existantes)
9. [Mettre a jour l'application apres des modifications](#mettre-a-jour-lapplication-apres-des-modifications)
10. [HTTPS et certificats](#https-et-certificats)
11. [Compatibilite avec un domaine qui a deja des sous-domaines](#compatibilite-avec-un-domaine-qui-a-deja-des-sous-domaines)
12. [Compatibilite avec d'autres conteneurs Docker](#compatibilite-avec-dautres-conteneurs-docker)
13. [Arborescence des fichiers cles](#arborescence-des-fichiers-cles)
14. [Variables d'environnement](#variables-denvironnement)
15. [Depannage](#depannage)

---

## Architecture globale

```
Navigateur
    |
    v
[Reverse Proxy externe]   <-- Ton proxy existant (Nginx, Caddy, Traefik...) OU le gateway Flowboard
    |
    +-- landing.tondomaine.com     --> landing/web (Vite build statique)
    |                                  landing/api (Node, port 8787)
    |
    +-- acme.tondomaine.com        --> Instance "acme" (conteneur web nginx:80)
    |       web -> api:3001 -> db
    |
    +-- demo.tondomaine.com        --> Instance "demo" (conteneur web nginx:80)
            web -> api:3001 -> db
```

Chaque instance client est un triplet de conteneurs Docker isoles :
- **db** : MariaDB 11 (volume persistent)
- **api** : Node.js 22 (Fastify, migrations Drizzle, JWT)
- **web** : Nginx Alpine (SPA React, proxy `/api` vers api)

Le **gateway Flowboard** (`landing/api/gateway/`) est un Nginx Docker qui route les sous-domaines vers les bons conteneurs web. Toutes les instances et le gateway partagent un reseau Docker externe `flowboard_gateway`.

---

## Pre-requis serveur

- **Docker** >= 24.x avec `docker compose` v2 (la commande `docker compose` sans tiret)
- **Node.js** >= 22 (pour le landing API seulement)
- **Git**
- Un nom de domaine avec acces au DNS (ou `localhost` pour tester en local)
- Ports **80** (et **443** si HTTPS) libres, ou un reverse proxy existant en amont

---

## Etape 1 - Cloner et preparer le repo

```bash
# Sur le serveur
git clone <url-du-repo> /opt/flowboard
cd /opt/flowboard

# Installer les dependances du landing
cd landing
npm install
cd ..
```

---

## Etape 2 - Configurer le domaine

### Cote DNS

Creer un enregistrement **wildcard** pour les instances :

```
*.flowboard.tondomaine.com    A    <IP du serveur>
```

Et un enregistrement pour le landing si besoin :

```
flowboard.tondomaine.com      A    <IP du serveur>
```

### Cote serveur (variables d'environnement)

Creer un fichier `.env` dans `landing/api/` (ou exporter ces variables) :

```bash
# Domaine de base pour les instances (sans protocole)
INSTANCE_BASE_HOST=flowboard.tondomaine.com

# Protocole (http en dev, https en prod avec TLS)
INSTANCE_PROTOCOL=https

# Port du landing API
PORT=8787

# Chemin absolu vers la racine du repo (pour docker build)
APP_ROOT=/opt/flowboard

# Repertoire de stockage des configs d'instances generees
INSTANCES_DIR=/opt/flowboard/landing/api/instances
```

Cote landing web, creer `landing/web/.env` (ou `.env.production`) :

```bash
VITE_INSTANCE_BASE_HOST=flowboard.tondomaine.com
```

Puis builder le front :

```bash
cd landing
npm run build
```

Le build statique se retrouve dans `landing/web/dist/`.

---

## Etape 3 - Deployer le landing

### Option A : Landing API en direct + front statique derriere Nginx/Caddy

1. Lancer le landing API :

```bash
cd /opt/flowboard/landing/api
node index.mjs
# ou avec un process manager :
# pm2 start index.mjs --name flowboard-landing-api
```

2. Servir `landing/web/dist/` avec ton serveur web, en proxifiant `/api` vers `http://localhost:8787` :

Exemple Nginx :

```nginx
server {
    listen 80;
    server_name flowboard.tondomaine.com;

    root /opt/flowboard/landing/web/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Option B : Tout en dev (test local)

```bash
# Terminal 1 : Landing API
cd landing && npm run dev:api

# Terminal 2 : Landing web (Vite dev server, proxy auto vers 8787)
cd landing && npm run dev:web
```

Le landing est accessible sur `http://localhost:5174`.

---

## Etape 4 - Lancer le gateway

Le gateway est le Nginx Docker qui route `slug.tondomaine.com` vers les instances.

```bash
# Creer le reseau partage (une seule fois)
docker network create flowboard_gateway

# Lancer le gateway
cd /opt/flowboard/landing/api/gateway
docker compose up -d
```

Le gateway ecoute sur le port **80**. Si ce port est deja pris par un autre service, voir la section [Compatibilite avec d'autres conteneurs Docker](#compatibilite-avec-dautres-conteneurs-docker).

---

## Etape 5 - Tester la creation d'une instance

Depuis le landing, choisis un plan, remplis le formulaire (slug, email, mot de passe).

Ce qui se passe en coulisses :

1. `POST /api/instances` valide les champs
2. Le provisioner genere un `docker-compose.yml` dans `landing/api/instances/<slug>/`
3. `docker compose build` puis `docker compose up -d` pour le triplet db/api/web
4. Attente que les 3 conteneurs soient en etat `running`
5. Un fichier `landing/api/gateway/instances/<slug>.conf` est cree pour Nginx
6. Le gateway est recharge (`nginx -s reload`)
7. L'URL `http(s)://<slug>.tondomaine.com` est renvoyee au front

Pour verifier manuellement :

```bash
# Lister les instances en cours
docker ps --filter "name=fb-"

# Verifier une instance specifique
docker compose -p fb-acme ps

# Voir les logs d'une instance
docker compose -p fb-acme logs -f
```

---

## Gestion des instances existantes

### Arreter une instance

```bash
docker compose -p fb-<slug> -f landing/api/instances/<slug>/docker-compose.yml down
```

### Supprimer une instance et ses donnees

```bash
docker compose -p fb-<slug> -f landing/api/instances/<slug>/docker-compose.yml down -v
rm -rf landing/api/instances/<slug>
rm landing/api/gateway/instances/<slug>.conf
# Puis recharger le gateway
docker compose -f landing/api/gateway/docker-compose.yml exec gateway nginx -s reload
```

Penser aussi a retirer l'entree du fichier `landing/api/db.json`.

### Redemarrer une instance

```bash
docker compose -p fb-<slug> -f landing/api/instances/<slug>/docker-compose.yml restart
```

---

## Mettre a jour l'application apres des modifications

### Scenario : tu as modifie le code dans `apps/api` ou `apps/web`

Les images Docker des instances sont buildees a partir du code source dans `apps/`. Quand tu modifies le code, il faut **rebuild et redemarrer** chaque instance.

#### Mettre a jour TOUTES les instances d'un coup

```bash
cd /opt/flowboard

# Recuperer les changements
git pull

# Pour chaque instance, rebuild + restart
for dir in landing/api/instances/*/; do
    slug=$(basename "$dir")
    project="fb-${slug}"
    compose="${dir}docker-compose.yml"

    echo "=== Mise a jour de ${slug} ==="
    docker compose -p "$project" -f "$compose" build
    docker compose -p "$project" -f "$compose" up -d
done

echo "=== Toutes les instances ont ete mises a jour ==="
```

#### Mettre a jour UNE seule instance

```bash
slug="acme"
docker compose -p "fb-${slug}" -f "landing/api/instances/${slug}/docker-compose.yml" build
docker compose -p "fb-${slug}" -f "landing/api/instances/${slug}/docker-compose.yml" up -d
```

#### Mettre a jour le landing

```bash
cd /opt/flowboard/landing

# Rebuild le front
npm run build

# Redemarrer le landing API si modifie
# pm2 restart flowboard-landing-api
# ou simplement relancer : node landing/api/index.mjs
```

#### Mettre a jour le gateway

```bash
cd /opt/flowboard/landing/api/gateway
docker compose up -d --force-recreate
```

### Scenario : tu as modifie le schema de base de donnees (Drizzle)

L'API execute `runMigrate()` au demarrage. Quand tu modifies le schema :

```bash
# 1. Generer la migration
cd apps/api
npm run db:generate

# 2. Committer les fichiers de migration dans drizzle/

# 3. Rebuild et restart les instances (la migration s'execute au boot)
```

---

## HTTPS et certificats

Le gateway Flowboard ne gere pas TLS nativement. Pour ajouter HTTPS :

### Option 1 : Caddy en frontal (recommande, certificats automatiques)

```
*.flowboard.tondomaine.com {
    reverse_proxy flowboard-gateway:80
}

flowboard.tondomaine.com {
    root * /opt/flowboard/landing/web/dist
    file_server
    handle /api/* {
        reverse_proxy localhost:8787
    }
    try_files {path} /index.html
}
```

Caddy gere automatiquement Let's Encrypt pour le wildcard (necessite un challenge DNS).

### Option 2 : Nginx + Certbot en frontal

Ajouter un serveur Nginx hote (pas Docker) qui termine TLS et proxifie vers le gateway Docker sur le port 80.

---

## Compatibilite avec un domaine qui a deja des sous-domaines

**Oui, c'est compatible.** Voici comment :

Le systeme utilise un **prefixe de sous-domaine** configurable. Si ton domaine `tondomaine.com` a deja des sous-domaines (`blog.tondomaine.com`, `api.tondomaine.com`, etc.), tu peux utiliser un **sous-domaine intermediaire** :

```
INSTANCE_BASE_HOST=fb.tondomaine.com
```

Les instances seront alors accessibles sur :
- `acme.fb.tondomaine.com`
- `demo.fb.tondomaine.com`
- etc.

Cote DNS :

```
fb.tondomaine.com        A    <IP du serveur>
*.fb.tondomaine.com      A    <IP du serveur>
```

Tes autres sous-domaines (`blog.tondomaine.com`, etc.) ne sont pas affectes car le wildcard est sur `*.fb`.

Il n'y a aucun conflit possible tant que le nom choisi pour `INSTANCE_BASE_HOST` ne chevauche pas tes services existants.

---

## Compatibilite avec d'autres conteneurs Docker

**Oui, c'est compatible.** Quelques points a verifier :

### Port 80

Le gateway Flowboard ecoute sur le port 80 de l'hote. Si un autre service utilise deja le port 80 :

**Solution 1** : Changer le port du gateway dans `landing/api/gateway/docker-compose.yml` :

```yaml
ports:
  - "8080:80"   # au lieu de "80:80"
```

Puis pointer ton reverse proxy externe vers `localhost:8080` pour les domaines `*.fb.tondomaine.com`.

**Solution 2** : Connecter le gateway a ton reverse proxy existant via un reseau Docker partage, sans exposer de port hote du tout :

```yaml
ports: []   # pas de port expose
networks:
  - flowboard_gateway
  - ton_reseau_proxy    # reseau de ton Traefik/Nginx existant
```

### Reseaux Docker

Les instances Flowboard utilisent un reseau Docker externe nomme `flowboard_gateway`. Ce reseau est cree une seule fois et ne touche pas aux autres reseaux Docker de ton serveur.

Chaque instance a aussi un reseau `internal` prive (db/api/web ne sont pas exposes sur l'hote).

### Noms de conteneurs

Tous les conteneurs Flowboard sont prefixes par `fb-<slug>-` (ex: `fb-acme-web-1`, `fb-acme-api-1`, `fb-acme-db-1`). Il n'y a pas de risque de collision avec tes autres conteneurs.

### Volumes

Les volumes Docker sont aussi prefixes par le project name (`fb-<slug>_mariadb_data`, etc.).

---

## Arborescence des fichiers cles

```
/opt/flowboard/
|-- apps/
|   |-- api/                  # Code source API (Fastify + Drizzle)
|   |   |-- Dockerfile
|   |   |-- src/
|   |   +-- drizzle/          # Fichiers de migration SQL
|   +-- web/                  # Code source front (React + Vite)
|       |-- Dockerfile
|       +-- nginx.conf
|
|-- landing/
|   |-- web/                  # Site vitrine (React)
|   |   |-- dist/             # Build statique (apres npm run build)
|   |   +-- src/
|   +-- api/                  # API de provisioning
|       |-- index.mjs         # Serveur HTTP (port 8787)
|       |-- config.mjs        # Variables centralisees
|       |-- provisioner.mjs   # Logique Docker de creation d'instance
|       |-- db.json           # Registre des instances creees
|       |-- instance-template/
|       |   +-- docker-compose.yml.tpl   # Template compose par instance
|       |-- instances/         # Genere automatiquement
|       |   +-- <slug>/
|       |       |-- docker-compose.yml
|       |       +-- .env
|       +-- gateway/
|           |-- docker-compose.yml
|           |-- nginx.conf
|           +-- instances/     # Genere automatiquement
|               +-- <slug>.conf
|
+-- docker-compose.yml        # Stack originale (pour dev standalone)
```

---

## Variables d'environnement

### Landing API (`landing/api/`)

| Variable | Defaut | Description |
|---|---|---|
| `PORT` | `8787` | Port d'ecoute du landing API |
| `DB_PATH` | `./db.json` | Chemin vers le registre JSON |
| `INSTANCE_BASE_HOST` | `localhost` | Domaine de base pour les instances |
| `INSTANCE_PROTOCOL` | `http` | `http` ou `https` |
| `APP_ROOT` | `../../` | Racine du repo (pour `docker build`) |
| `INSTANCES_DIR` | `./instances` | Repertoire des configs generees |

### Landing Web (`landing/web/`)

| Variable | Defaut | Description |
|---|---|---|
| `VITE_INSTANCE_BASE_HOST` | `localhost` | Domaine affiche dans le formulaire |

### Par instance (genere automatiquement)

Chaque instance recoit ses propres secrets (generes aleatoirement) :
- `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- `JWT_SECRET`
- `ADMIN_BOOTSTRAP_USERNAME` (email du formulaire)
- `ADMIN_BOOTSTRAP_PASSWORD` (mot de passe du formulaire)
- `CORS_ORIGIN` (URL de l'instance)

---

## Depannage

### Le provisioning echoue avec "did not become healthy"

```bash
# Voir les logs de l'instance
docker compose -p fb-<slug> -f landing/api/instances/<slug>/docker-compose.yml logs

# Verifier que MariaDB demarre bien
docker compose -p fb-<slug> -f landing/api/instances/<slug>/docker-compose.yml logs db
```

### Le sous-domaine renvoie 404

```bash
# Verifier que le fichier de config gateway existe
ls landing/api/gateway/instances/

# Verifier que le gateway est lance
docker compose -f landing/api/gateway/docker-compose.yml ps

# Forcer un reload
docker compose -f landing/api/gateway/docker-compose.yml exec gateway nginx -s reload
```

### Conflit de port 80

Si tu as deja un service sur le port 80, change le port du gateway ou mets ton reverse proxy en amont (voir la section compatibilite).

### Les cookies ne marchent pas sur l'instance

L'API Flowboard utilise des cookies `httpOnly`. En production avec `NODE_ENV=production`, le flag `secure` est actif, ce qui necessite HTTPS. Assure-toi que TLS est termine avant le gateway.

### Le `docker compose build` est tres long

Les images sont buildees a chaque creation d'instance. Pour accelerer :

```bash
# Pre-builder les images une fois
cd /opt/flowboard
docker compose -f docker-compose.yml build

# Les instances reutiliseront le cache Docker
```
