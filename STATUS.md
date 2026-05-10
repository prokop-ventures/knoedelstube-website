# Status — Hosting & Deployment

Stand: 2026-05-10

## Ziel

Knödelstube-Website + Mini-Mail-Backend auf dem bestehenden Hetzner-Server
(C23, läuft bereits Kilian-App) mitlaufen lassen. Web3Forms ablösen, Versand
über Strato-SMTP des Postfachs `kontakt@hefangelist.de`.

## Architektur-Entscheidungen

- **Caddy bleibt zentral** im Kilian-Stack — kein "Edge-Stack"-Umzug.
- **Entkopplung Kilian ↔ Knödelstube** durch Caddy-Hot-Reload statt
  Container-Restart bei Kilian-Deploys.
- **Knödelstube-Stack getrennt** unter `/opt/knoedelstube/` mit eigener
  `mail.env`, eigenem Compose, eigenem GHCR-Image.
- **Statische Files** werden vom bestehenden Kilian-Caddy ausgeliefert
  (zusätzlicher Volume-Mount), Mail-Service läuft als eigener Container.
- **Deployment Knödelstube:** GitHub Actions auf Push to `main` (bewusst,
  damit auch andere Knödelstube-Mitarbeiter ohne SSH/kdc deployen können).
- **Deployment Kilian:** über `kdc deploy <tag>` direkt auf dem Server.
- **Mail-Versand:** Nodemailer → Strato SMTP **Port 587 mit STARTTLS**
  (`SMTP_SECURE=false`). Port 465 und 25 von Hetzner Outbound blockiert.
  `From: kontakt@hefangelist.de` (Strato-Pflicht), `To: info@knoedelstube.de`,
  `Reply-To: <Gast>`.
- **GHCR-Package public** — vermeidet permanente Login-Notwendigkeit.

## Schritt 1 — ABGESCHLOSSEN ✅

Mail-Service-Container läuft, Strato-SMTP funktioniert, Smoke-Tests grün.
Siehe Detail-Liste in vorherigem Status (gekürzt für Übersicht).

## Schritt 2 — ABGESCHLOSSEN ✅

Kilian-Repo-Patches deployed:

- ✅ `infrastructure/scripts/kilian-cli/kdc` — `--force-recreate caddy-prod`
  durch `caddy reload` ersetzt. Künftige `kdc deploy`-Aufrufe lassen die
  Knödelstube-Site online.
- ✅ `infrastructure/caddy/Caddyfile.prod` — Site-Block für
  `knoedelstube.hefangelist.de` ergänzt (statische Files + `/api/contact` +
  `/api/reservation` reverse-proxy).
- ✅ `infrastructure/docker-compose.yml` — `caddy-prod` mountet zusätzlich
  `/opt/knoedelstube/static-web:/srv/knoedelstube:ro`, Beitritt zu externem
  Netzwerk `knoedelstube_default`.

Live verifiziert:

- ✅ TLS-Cert via Let's Encrypt automatisch ausgestellt
- ✅ Site lädt schnell unter `https://knoedelstube.hefangelist.de`
- ✅ Reservierungsformular versendet Mail an `info@knoedelstube.de`
- ✅ Kontaktformular versendet Mail an `info@knoedelstube.de`

## UX- und Quality-Verbesserungen — ABGESCHLOSSEN ✅

- ✅ **Live-Validierung** für beide Formulare. E-Mail-Pattern matcht jetzt 1:1
  die Server-Regex (`gmxde` ohne Punkt wird sofort im Browser angezeigt).
  Inline-Fehlermeldungen unter dem jeweiligen Feld in deutscher Sprache,
  Auswertung über HTML5 Constraint Validation API.
- ✅ **Differenzierte Submit-Fehler** — 400 ("prüfe Eingaben"), 429 ("zu
  viele Anfragen"), 5xx (mit Telefonnummer als Fallback).
- ✅ **BonBon-Gutschein-Button** (`.bonbon_cpnbtn`) im Marken-Teal mit Hover-,
  Active- und Focus-Styles statt Default-Hellblau.
- ✅ **Cache-Header im Caddyfile** — HTML mit `no-cache` (immer revalidieren),
  Assets mit `max-age=3600, must-revalidate`. Resultat: Updates kommen ohne
  Hard-Reload an, schon ein normales Refresh reicht. Verifiziert.

## Phase 2 — Live-Schaltung der echten Domain — TODO

### Aktueller DNS-Zustand (Stand 2026-05-10)

| Hostname                       | A-Record           | DNS-Provider     | Hosting-Ziel             | Status           |
| ------------------------------ | ------------------ | ---------------- | ------------------------ | ---------------- |
| `kilian.hefangelist.de`        | `46.225.112.119`   | Strato           | Hetzner (Kilian)         | ✅ live          |
| `knoedelstube.hefangelist.de`  | `46.225.112.119`   | Strato           | Hetzner (Knödelstube)    | ✅ live          |
| `knoedelstube.de`              | `91.203.110.239`   | **checkdomain**  | dogado/anynode (alt)     | umzubiegen       |
| `www.knoedelstube.de`          | `91.203.110.239`   | **checkdomain**  | dogado/anynode (alt)     | umzubiegen       |

### DNS-Verwaltung — bestätigte Fakten

- `knoedelstube.de` ist **voll-autoritativ bei checkdomain** (verifiziert via
  `dig SOA` und `dig NS`):
  - SOA: `ns.checkdomain.de. hostmaster.checkdomain.de.`
  - NS: `ns.checkdomain.de.`, `ns2.checkdomain.de.`
- Keine zwischengeschaltete Nameserver-Delegation
- DNS-Änderung erfolgt **vollständig im checkdomain-Kundencenter**
- Negativ-Cache-TTL aus SOA: 300 s — A-Record-TTL separat prüfen via
  `dig knoedelstube.de A` (ohne `+short`)
- Beide A-Records (`knoedelstube.de` und `www.knoedelstube.de`) sind direkte
  A-Records, kein CNAME-Konstrukt → zwei Records umbiegen, nicht einen
- Die IP `91.203.110.239` gehört zu **anynode/dogado** — dort liegt
  vermutlich die alte Live-Seite. Bleibt nach Umzug verwaist (oder wird
  beim alten Hoster gekündigt, separat zu klären).

### Reihenfolge für die Live-Schaltung — wichtig

**Caddyfile-Patch zuerst, DNS später.** So vermeiden wir, dass DNS auf den
Hetzner zeigt, bevor Caddy weiß, was er für `knoedelstube.de` ausliefern
soll.

1. **Im Kilian-Repo** — `infrastructure/caddy/Caddyfile.prod` erweitern:
   Hostnamen-Liste im bestehenden Knödelstube-Block ergänzen:
   ```caddy
   knoedelstube.hefangelist.de, knoedelstube.de, www.knoedelstube.de {
       ... bestehender Inhalt unverändert ...
   }
   ```

2. **`/opt/knoedelstube/mail.env`** auf dem Server:
   ```
   ALLOWED_ORIGIN=https://knoedelstube.hefangelist.de,https://knoedelstube.de,https://www.knoedelstube.de
   ```
   Mail-Container recreate:
   ```bash
   cd /opt/knoedelstube
   docker compose up -d --force-recreate knoedel-mail
   ```

3. **Deploy** (Kilian): `kdc deploy <tag>` mit dem neuen Caddyfile.
   Stack ist jetzt vorbereitet, Caddy hat Cert-Issuance für die zwei neuen
   Hostnamen geplant. Holt aber noch keins, weil DNS noch nicht zeigt.

4. **Optional vorab — TTL bei checkdomain reduzieren:**
   Im checkdomain-Kundencenter A-Record-TTL auf `300` setzen (ohne IP zu
   ändern), speichern. Ein paar Stunden warten, damit alle Resolver die
   niedrige TTL übernehmen. Erst dann IP umbiegen — das macht Korrekturen
   schneller, falls etwas schiefgeht.

5. **DNS-Umzug bei checkdomain:** Login bei https://www.checkdomain.de →
   *Meine Domains* → `knoedelstube.de` → DNS-/Zonenverwaltung. Beide A-Records:
   - `knoedelstube.de` (oder `@` / leerer Hostname) → `46.225.112.119`
   - `www` → `46.225.112.119`

   Die genaue Bezeichnung des Root-Hostnamens variiert je nach UI (`@`,
   leer, oder voller Domainname mit Punkt). Vor Ort sehen.

6. **Propagation abwarten** (je nach gesetzter TTL Minuten bis Stunden):
   ```bash
   dig +short knoedelstube.de
   dig +short www.knoedelstube.de
   ```
   Beide sollten `46.225.112.119` zurückgeben.

7. **Caddy holt automatisch Let's-Encrypt-Certs** beim ersten HTTPS-Request
   für die zwei neuen Hostnamen (HTTP-01-Challenge auf Port 80). Dauert ~30 s.
   Logs verifizieren:
   ```bash
   docker logs infrastructure-caddy-prod-1 -f
   ```

8. **Verifikation:**
   - `https://knoedelstube.de` lädt mit gültigem Cert
   - `https://www.knoedelstube.de` lädt mit gültigem Cert
   - Browser-DevTools: `Cache-Control: no-cache` auf HTML, `max-age=3600`
     auf Assets
   - Test-Submit eines Formulars von der echten Domain → Mail kommt an

9. **Optional — SEO-Hygiene nach erfolgreichem Live-Gang:**
   Subdomain `knoedelstube.hefangelist.de` auf die Hauptdomain redirecten,
   damit Suchmaschinen nur die "echte" URL indexieren. Im Kilian-Caddyfile
   einen separaten Block ergänzen:
   ```caddy
   knoedelstube.hefangelist.de {
       redir https://knoedelstube.de{uri} permanent
   }
   ```
   Und aus dem Hauptblock die Subdomain entfernen (sonst kollidieren die
   Site-Blöcke).

### Empfohlener Zeitpunkt

- **Werktag, früher Vormittag** — falls etwas schiefgeht, ist Support
  bei checkdomain erreichbar.
- **Nicht direkt vor einem Wochenende** — Wochenende ist Hauptzeit für ein
  Restaurant.
- Restaurant vorher informieren, dass es eine kurze Phase (vermutlich nur
  Minuten) geben kann, in der manche Besucher die alte Seite, manche schon
  die neue sehen.

### Mini-Downtime-Fenster — was real passiert

Während der DNS-Propagation cachen Resolver weltweit unterschiedlich:
- Resolver mit aktualisierter Antwort → Hetzner-Server
- Resolver mit alter Antwort → dogado/anynode (alte Seite)

Es gibt **keine harte Downtime** — beide Server liefern weiterhin Inhalte
aus, nur jeweils unterschiedliche. Sobald die niedrige TTL bei allen
Resolvern überall propagiert ist (max. der bisherigen TTL-Dauer), ist nur
noch der Hetzner sichtbar. Caddyfile-Patch vorab deployen ist daher
risikoarm.

### Was nach Phase 2 noch übrig ist (Hygiene)

- Alte Webhosting-Pakete prüfen: zahlst du irgendwo noch für die alte
  Seite (dogado oder über Strato als Reseller)? Falls ja: kündigen, sobald
  der Umzug verifiziert läuft.
- Mail-Forwards/Aliase auf der alten Domain prüfen — nur DNS umbiegen
  reicht nicht, wenn `info@knoedelstube.de` als Mail-Alias beim alten
  Hoster eingerichtet war. MX-Records bei checkdomain müssen weiter zum
  Mail-Provider zeigen, wo das Postfach von Irena liegt.
- AAAA-Records (IPv6): aktuell hat `kilian.hefangelist.de` einen AAAA?
  Falls ja, analog für die Knödelstube-Domains anlegen.

## Lessons Learned

1. **Hetzner Cloud blockt Outbound-SMTP** auf 25 + 465. Port 587 (STARTTLS)
   nutzen.
2. **Docker Compose interpoliert `env_file`-Werte** — `$` im Passwort als
   `$$` escapen.
3. **GHCR-Packages privat per Default** — auf Public stellen oder Server
   permanent einloggen.
4. **Browser-`type=email`-Validierung ist lax** (akzeptiert `gmxde` ohne
   Punkt). Server-Validierung muss strenger sein, Frontend braucht ein
   `pattern`-Attribut zum Matchen.
5. **Build-Workflow im Kilian-Repo** läuft nicht automatisch beim Tag-Push,
   sondern nur per `workflow_dispatch`.
6. **Caddy `--force-recreate`** in `kdc` war der eigentliche Übeltäter für
   Cross-Site-Downtimes — Hot-Reload via `caddy reload` löst das sauber.

## Ressourcen-Status

- `knoedel-mail` Idle: ~23 MiB RAM, 0 % CPU
- Server gesamt 3,73 GiB RAM, alle Container ~270 MiB → reichlich Luft
- Erwartete Last: < 500 Page Views/Tag, < 20 Form-Submits/Tag
