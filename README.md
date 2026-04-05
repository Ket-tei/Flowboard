# Flowboard

Application web conteneurisée pour gérer des diaporamas (images, vidéos, GIF) sur des écrans, avec rôles **Administrateur** / **Utilisateur**, base **MariaDB**, API **Node (Fastify)** et interface **React + shadcn/ui**.

## Démarrage avec Docker

```bash
docker compose up --build
```

- Interface : [http://localhost](http://localhost) (nginx sert le build React et proxifie `/api` vers l’API).
- API directe (hors navigateur) : [http://localhost:3001](http://localhost:3001).
- MariaDB : port `3306` (identifiants par défaut dans `docker-compose.yml`).

Compte administrateur initial (variables d’environnement du service `api`, modifiables dans `docker-compose.yml`) :

- Utilisateur : `admin`
- Mot de passe : `admin123`

## Développement local

1. Démarrer MariaDB (ou utiliser celle du compose) et définir `DATABASE_URL` dans `apps/api` (voir [.env.example](.env.example)).
2. API :

```bash
cd apps/api
npm install
npm run dev
```

3. Web (proxy Vite vers l’API sur le port 3001) :

```bash
cd apps/web
npm install
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173). Les requêtes vers `/api` sont proxifiées vers `http://localhost:3001`.

## Diaporama public

Chaque écran possède un jeton secret dans l’URL :

`/show/<publicToken>`

Cette page ne nécessite pas de compte. Un *service worker* met en cache manifeste et médias pour un affichage dégradé hors ligne. Les mises à jour de playlist sont détectées via le champ `revision` du manifeste (polling).

## Structure

- [apps/api](apps/api) — API REST, authentification JWT (cookie httpOnly), fichiers médias sur volume `UPLOAD_DIR`.
- [apps/web](apps/web) — SPA React, shadcn, i18n FR/EN, thème clair/sombre/système.
- [docker-compose.yml](docker-compose.yml) — services `db`, `api`, `web`.
