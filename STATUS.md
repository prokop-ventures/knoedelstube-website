# Status — Hosting & Deployment

Stand: 2026-05-06

## Ziel

Knödelstube-Website + Mini-Mail-Backend auf dem bestehenden Hetzner-Server
(C23, läuft bereits Kilian-App) mitlaufen lassen. Web3Forms ablösen, Versand
über Strato-SMTP des Postfachs `kontakt@hefangelist.de`.

## Architektur-Entscheidungen

- **Caddy bleibt zentral** im Kilian-Stack — kein "Edge-Stack"-Umzug
  (Migration wurde als zu riskant eingestuft).
- **Entkopplung Kilian ↔ Knödelstube** durch Caddy-Hot-Reload statt
  Container-Restart bei Kilian-Deploys.
- **Knödelstube-Stack getrennt** unter `/opt/knoedelstube/` mit eigener
  `.env`, eigenem Compose, eigenem GHCR-Image.
- **Statische Files** werden vom bestehenden Kilian-Caddy ausgeliefert
  (zusätzlicher Volume-Mount), Mail-Service läuft als eigener Container.
- **Deployment:** GitHub Actions auf Push to `main` (bewusst gewählt, damit
  auch andere Knödelstube-Mitarbeiter ohne SSH/kdc deployen können).
  Kilian dagegen wird über `kdc deploy` direkt auf dem Server deployed.
- **Mail-Versand:** Nodemailer → Strato SMTPS Port 465.
  `From: kontakt@hefangelist.de` (Strato-Pflicht), `To: info@knoedelstube.de`
  (Irenas Postfach), `Reply-To: <Gast>`.
- **Test über Subdomain `knoedelstube.hefangelist.de` zuerst**, später
  `knoedelstube.de` zusätzlich. Caddy serviert beide Hostnamen aus demselben
  Site-Block.

## Schritt 1 — fertig im Repo (noch nicht deployed)

**Neu angelegt:**

- `server/` — Express + Nodemailer Mail-Service
  - `Dockerfile` (Node 24-alpine, Multi-Stage)
  - `package.json` (express, express-rate-limit, nodemailer)
  - `src/index.mjs` — 2 Endpoints `/api/contact`, `/api/reservation`,
    Honeypot, Rate-Limit (5/h/IP), Multi-Origin-CORS
  - `src/mail.mjs` — Nodemailer-Transport
  - `src/templates.mjs` — Reservierungs- + Kontakt-Mail-Template
    (Reservierungs-Template 1:1 aus altem `reservation-config.js` übernommen)
- `infrastructure/`
  - `docker-compose.yml` — `knoedel-mail` Service (GHCR-Image)
  - `Caddyfile.snippet` — Block für Schritt 2 (Multi-Hostname inkl.
    Subdomain + auskommentierte Canonical-Redirect-Variante)
  - `.env.example` — Vorlage mit Strato-Konfig
- `.github/workflows/deploy.yml` — Build → GHCR → rsync + `docker compose up`
- `SETUP.md` — Server-Setup-Anleitung + Smoke-Test

**Geändert:**

- `index.html` — Web3Forms-Hidden-Felder + Submit-Code raus, beide Formulare
  posten JSON gegen `/api/contact` und `/api/reservation`. Honeypot bleibt.

**Gelöscht:**

- `reservation-config.js` (Logik ist jetzt serverseitig)

## Schritt 1 — offene Aufgaben (auf dem Server / in GitHub)

1. DNS-A-Record `knoedelstube.hefangelist.de` → Hetzner-IP setzen
2. Auf dem Server: `mkdir -p /opt/knoedelstube/static-web` + ownership
3. `/opt/knoedelstube/.env` anlegen mit Strato-Credentials (Vorlage:
   `infrastructure/.env.example`), `chmod 600`
4. GitHub-Secrets im Repo anlegen: `HETZNER_HOST`, `HETZNER_USER`,
   `HETZNER_SSH_KEY`
5. `git push origin main` triggert ersten Deploy
6. Smoke-Test: `docker exec knoedel-mail wget -qO- http://127.0.0.1:3000/health`

## Schritt 2 — noch zu tun (Kilian-Repo, später)

Kilian wird über `kdc` deployed. Drei Stellen müssen geändert werden:

1. **`infrastructure/scripts/kilian-cli/kdc`** (Zeile ~325):
   `--force-recreate caddy-prod` ersetzen durch
   `docker exec kilian-caddy-prod-1 caddy reload --config /etc/caddy/Caddyfile`
   → Caddy wird beim Kilian-Deploy nicht mehr restartet.

2. **`infrastructure/caddy/Caddyfile.prod`**:
   Knödelstube-Block aus `infrastructure/Caddyfile.snippet` einfügen.

3. **`infrastructure/docker-compose.yml`** (Kilian) — `caddy-prod` ergänzen:
   - Volume: `/opt/knoedelstube/static-web:/srv/knoedelstube:ro`
   - Beitritt zum Knödelstube-Compose-Netzwerk (extern), damit Hostname
     `knoedel-mail:3000` auflösbar ist.

Bekannter Nebeneffekt: `kdc recreate prod caddy-prod` (manuell) startet
weiterhin Caddy neu → kurze Knödelstube-Downtime. Akzeptiert, da nur
bewusster manueller Eingriff.

## Phasenplan Domain

- **Phase 1 (Test):** Nur `knoedelstube.hefangelist.de` im Caddy-Block,
  `ALLOWED_ORIGIN` enthält nur diese URL. `knoedelstube.de` bleibt auf alter
  Live-Seite.
- **Phase 2 (Live):** DNS für `knoedelstube.de` + `www.knoedelstube.de` auf
  Hetzner-Server umbiegen, Hostnamen im Caddy-Block ergänzen, `caddy reload`,
  `ALLOWED_ORIGIN` erweitern, Mail-Container neu starten. Optional: Subdomain
  per 301 auf Hauptdomain redirecten (Snippet auskommentiert vorhanden).

## Ressourcen-Einschätzung

Zusatzlast auf C23: vernachlässigbar.
- Mail-Container Idle: ~70 MB RAM, < 0,1 % CPU
- Statische Files: vom bestehenden Caddy ausgeliefert, kein neuer Prozess
- Erwartete Last: < 500 Page Views/Tag, < 20 Form-Submits/Tag
