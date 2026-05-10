# Knödelstube — Server-Setup (Schritt 1)

Dies sind die einmaligen Schritte, um Mail-Service + statische Files auf dem
Hetzner-Server lauffähig zu machen. **Erreichbar von außen** ist die Seite nach
Schritt 1 noch nicht — das passiert in Schritt 2 (Caddy-Konfiguration im
Kilian-Repo).

## 1. Verzeichnisse anlegen

Auf dem Server:

```bash
sudo mkdir -p /opt/knoedelstube/static-web
sudo chown -R $USER:$USER /opt/knoedelstube
```

## 2. mail.env mit Strato-Zugangsdaten anlegen

> **Wichtig:** Datei heißt `mail.env`, **nicht** `.env`. Sonst interpretiert
> Docker Compose sie zusätzlich als Projekt-Interpolation-Datei und stolpert
> über `$`-Zeichen im SMTP-Passwort.

```bash
nano /opt/knoedelstube/mail.env
```

Inhalt nach Vorlage `infrastructure/.env.example` (`SMTP_PASS` mit echtem
Passwort ersetzen, `GITHUB_REPOSITORY` ggf. anpassen):

```env
SMTP_HOST=smtp.strato.de
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=kontakt@hefangelist.de
SMTP_PASS=<dein-strato-postfach-passwort>
MAIL_FROM="Knödelstube Webformular <kontakt@hefangelist.de>"
MAIL_TO=info@knoedelstube.de
ALLOWED_ORIGIN=https://knoedelstube.de
RATE_LIMIT_PER_HOUR=5
PORT=3000
GITHUB_REPOSITORY=<github-user>/knoedelstube-website
IMAGE_TAG=latest
```

```bash
chmod 600 /opt/knoedelstube/mail.env
```

## 3. GitHub-Secrets

Im GitHub-Repo unter `Settings → Secrets and variables → Actions`:

| Secret              | Inhalt                                        |
| ------------------- | --------------------------------------------- |
| `HETZNER_HOST`      | IP oder Hostname des Servers                  |
| `HETZNER_USER`      | SSH-User (vermutlich derselbe wie für Kilian) |
| `HETZNER_SSH_KEY`   | privater SSH-Key (kann mit Kilian geteilt werden) |

`GITHUB_TOKEN` wird automatisch von Actions bereitgestellt — kein eigener Eintrag nötig.

## 4. Erster Deploy auslösen

```bash
git push origin main
```

Der Workflow:

1. baut das `mail`-Docker-Image und pusht nach `ghcr.io/<user>/knoedelstube-website/mail`
2. rsync't die statischen Files nach `/opt/knoedelstube/static-web/`
3. `docker compose pull && up -d` startet den `knoedel-mail`-Container

**Test des Mail-Containers** (vom Server aus, da von außen noch nicht erreichbar):

```bash
docker exec knoedel-mail wget -qO- http://127.0.0.1:3000/health
# erwartete Antwort: {"ok":true}
```

Senden lässt sich z.B. so testen:

```bash
docker exec knoedel-mail node -e "
  fetch('http://127.0.0.1:3000/api/contact', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      name:'Test', email:'test@example.com', betreff:'Smoke Test', nachricht:'Hi'
    })
  }).then(r => r.json()).then(console.log)
"
```

Wenn `{ ok: true }` zurückkommt und im Strato-Postfach `info@knoedelstube.de` eine
Mail liegt, ist Schritt 1 abgeschlossen.

## 5. Was als nächstes (Schritt 2)

Kilian wird inzwischen über das **`kdc`-CLI direkt auf dem Server** deployed
(nicht mehr über GitHub Actions). Der Patch betrifft daher drei Stellen im
**Kilian-Repo**:

1. **`infrastructure/scripts/kilian-cli/kdc`** (Zeile ~325)
   `compose_cmd prod up -d --no-deps --force-recreate caddy-prod` ersetzen
   durch einen Hot-Reload:
   `docker exec kilian-caddy-prod-1 caddy reload --config /etc/caddy/Caddyfile`
   (Container-Name ggf. mit `docker ps` verifizieren). Damit wird Caddy beim
   Kilian-Deploy nicht mehr neu gestartet — die Knödelstube-Site bleibt online.

2. **`infrastructure/caddy/Caddyfile.prod`**
   Block aus `infrastructure/Caddyfile.snippet` (dieses Repo) einfügen.

3. **`infrastructure/docker-compose.yml`** (Kilian)
   - `caddy-prod` bekommt zusätzlich:
     `- /opt/knoedelstube/static-web:/srv/knoedelstube:ro`
   - `caddy-prod` joint das Compose-Netzwerk dieses Stacks (als external),
     damit der Hostname `knoedel-mail:3000` aus dem Caddyfile auflösbar ist.

Diese Änderungen werden in Schritt 2 separat eingespielt und betreffen dieses
Repo nicht.
