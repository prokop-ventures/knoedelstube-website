# Status — Hosting & Deployment

Stand: 2026-05-07

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
  `mail.env`, eigenem Compose, eigenem GHCR-Image.
- **Statische Files** werden vom bestehenden Kilian-Caddy ausgeliefert
  (zusätzlicher Volume-Mount), Mail-Service läuft als eigener Container.
- **Deployment:** GitHub Actions auf Push to `main` (bewusst gewählt, damit
  auch andere Knödelstube-Mitarbeiter ohne SSH/kdc deployen können).
  Kilian dagegen wird über `kdc deploy` direkt auf dem Server deployed.
- **Mail-Versand:** Nodemailer → Strato SMTP **Port 587 mit STARTTLS**
  (`SMTP_SECURE=false`). Port 465 und 25 von Hetzner Outbound blockiert.
  `From: kontakt@hefangelist.de` (Strato-Pflicht), `To: info@knoedelstube.de`
  (Irenas Postfach), `Reply-To: <Gast>`.
- **GHCR-Package public** — vermeidet permanente Login-Notwendigkeit auf dem
  Server.
- **Test über Subdomain `knoedelstube.hefangelist.de` zuerst**, später
  `knoedelstube.de` zusätzlich. Caddy serviert beide Hostnamen aus demselben
  Site-Block.

## Schritt 1 — ABGESCHLOSSEN ✅

**Verifiziert auf Produktion:**

- ✅ GitHub Actions Workflow baut Image, pusht nach GHCR
  (`ghcr.io/prokop-ventures/knoedelstube-website/mail`)
- ✅ Statische Files werden nach `/opt/knoedelstube/static-web/` gerysynct
- ✅ `knoedel-mail`-Container läuft, healthcheck grün, ~23 MiB RAM
- ✅ `mail.env` wird korrekt eingelesen, Nodemailer initialisiert ohne Fehler
- ✅ STARTTLS-Verbindung zu `smtp.strato.de:587` baut auf
- ✅ Authentifizierung mit `kontakt@hefangelist.de` erfolgreich
- ✅ Smoke-Test-Mail via `/api/contact` ist im Postfach angekommen
- ✅ Kilian-Stack unbeeinflusst, eigenes Docker-Netzwerk (`knoedelstube_default`)

**Repo-Stand:**

- `server/` — Express + Nodemailer Mail-Service (Node 24-alpine)
- `infrastructure/docker-compose.yml` — `knoedel-mail` Service mit fest
  verdrahtetem Image-Pfad `ghcr.io/prokop-ventures/...`, env_file: `mail.env`
- `infrastructure/Caddyfile.snippet` — Block für Schritt 2
- `infrastructure/.env.example` — Vorlage mit Port 587 / STARTTLS
- `.github/workflows/deploy.yml` — Build → GHCR → rsync + docker compose up
- `index.html` — beide Formulare posten JSON gegen `/api/contact` und
  `/api/reservation`, Web3Forms entfernt
- `reservation-config.js` — gelöscht, Template lebt in `server/src/templates.mjs`
- `SETUP.md` — Server-Setup-Anleitung

**Server-Stand `/opt/knoedelstube/`:**

```
docker-compose.yml      ← vom Workflow gepusht
mail.env                ← manuell, chmod 600, $-Zeichen escaped als $$
static-web/             ← rsync-Target für statische Files
```

## Schritt 2 — TODO (Kilian-Repo, später)

Kilian wird über `kdc` deployed. Drei Stellen müssen geändert werden:

1. **`infrastructure/scripts/kilian-cli/kdc`** (Zeile ~325):
   `--force-recreate caddy-prod` ersetzen durch
   `docker exec kilian-caddy-prod-1 caddy reload --config /etc/caddy/Caddyfile`
   → Caddy wird beim Kilian-Deploy nicht mehr restartet.

2. **`infrastructure/caddy/Caddyfile.prod`**:
   Knödelstube-Block aus `infrastructure/Caddyfile.snippet` (dieses Repo)
   einfügen. Phase 1: nur Hostname `knoedelstube.hefangelist.de`.

3. **`infrastructure/docker-compose.yml`** (Kilian) — `caddy-prod` ergänzen:
   - Volume: `/opt/knoedelstube/static-web:/srv/knoedelstube:ro`
   - Beitritt zum Knödelstube-Compose-Netzwerk (`knoedelstube_default`)
     als external, damit Hostname `knoedel-mail:3000` auflösbar ist.

Bekannter Nebeneffekt: `kdc recreate prod caddy-prod` (manuell) startet
weiterhin Caddy neu → kurze Knödelstube-Downtime. Akzeptiert, da nur
bewusster manueller Eingriff.

## Schritt 3 — Live-Schaltung (nach erfolgreichem Phase-1-Test)

1. DNS bei Strato: A-Record für `knoedelstube.de` und `www.knoedelstube.de`
   auf Hetzner-IP `46.225.112.119` ändern (aktuell zeigen sie auf alte
   Strato-Hosting-IP).
2. Caddyfile-Block im Kilian-Repo um beide Hostnamen erweitern.
3. `docker exec kilian-caddy-prod-1 caddy reload`.
4. `mail.env` `ALLOWED_ORIGIN` um beide Hauptdomains erweitern, Mail-Container
   recreaten.
5. Optional: Subdomain `knoedelstube.hefangelist.de` per 301 auf
   Hauptdomain redirecten (Snippet auskommentiert vorhanden).

## DNS-Status

| Hostname                       | A-Record           | Status                |
| ------------------------------ | ------------------ | --------------------- |
| `kilian.hefangelist.de`        | `46.225.112.119`   | ✅ Hetzner            |
| `knoedelstube.hefangelist.de`  | (zu prüfen / setzen) | umzubiegen auf Hetzner |
| `knoedelstube.de`              | (zu prüfen)        | aktuell alte Live-Seite |
| `www.knoedelstube.de`          | (zu prüfen)        | aktuell alte Live-Seite |

## Lessons Learned (für nächstes Mal)

Drei nicht-offensichtliche Fallen, die Stunden gekostet haben:

1. **Hetzner Cloud blockt Outbound-SMTP** auf Port 25 und 465 standardmäßig.
   Port 587 (Submission, STARTTLS) ist offen — daher
   `SMTP_PORT=587` + `SMTP_SECURE=false`. Verifikation:
   `nc -zv smtp.strato.de 587`.

2. **Docker Compose interpoliert `env_file`-Werte**. `$`-Zeichen im
   SMTP-Passwort müssen als `$$` escaped werden, sonst landen leere
   Strings als Passwort im Container. Symptom: `WARN The "xLNe" variable is
   not set. Defaulting to a blank string.` und später Auth-Fail beim Versand.

3. **GHCR-Packages sind privat per Default**. Manueller `docker compose pull`
   auf dem Server scheitert mit `not found` (statt `forbidden` — GHCR-Quirk),
   sobald der Workflow-Token abgelaufen ist. Pragmatischste Lösung: Package
   auf Public stellen.

## Ressourcen-Einschätzung (verifiziert)

- `knoedel-mail` Idle: **23 MiB RAM**, 0 % CPU
- Server gesamt 3,73 GiB RAM, alle Container zusammen ~270 MiB → reichlich Luft
- Statische Files: vom bestehenden Caddy ausgeliefert, kein neuer Prozess
- Erwartete Last: < 500 Page Views/Tag, < 20 Form-Submits/Tag
