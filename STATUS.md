# Status — Hosting & Deployment

Stand: 2026-05-11

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

## Phase 2 — Live-Schaltung der echten Domain — ABGESCHLOSSEN ✅

Live seit 2026-05-11. `knoedelstube.de` und `www.knoedelstube.de` zeigen auf
den Hetzner, Caddy hat gültige Let's-Encrypt-Certs für beide Hostnamen.

### Aktueller DNS-Zustand (Stand 2026-05-11)

| Hostname                       | A-Record           | DNS-Provider     | Hosting-Ziel             | Status           |
| ------------------------------ | ------------------ | ---------------- | ------------------------ | ---------------- |
| `kilian.hefangelist.de`        | `46.225.112.119`   | Strato           | Hetzner (Kilian)         | ✅ live          |
| `knoedelstube.hefangelist.de`  | `46.225.112.119`   | Strato           | Hetzner (Knödelstube)    | ✅ live          |
| `knoedelstube.de`              | `46.225.112.119`   | **checkdomain**  | Hetzner (Knödelstube)    | ✅ live          |
| `www.knoedelstube.de`          | `46.225.112.119`   | **checkdomain**  | Hetzner (Knödelstube)    | ✅ live          |

### Tatsächlich genutztes Verfahren (für künftige checkdomain-Migrationen)

Folgende Reihenfolge hat am 2026-05-11 zum Erfolg geführt. **Wichtigste
Erkenntnis: Die Paketdomain-Bindung muss NICHT gelöst werden** (vgl. weiter
unten, „Widerlegte Annahmen"). Der zentrale Knopf ist „Basisschutz".

1. **Caddy-Block per Container-Restart aktivieren** (`caddy reload` ist im
   Stack nicht zuverlässig, siehe Lessons Learned):
   ```bash
   docker restart infrastructure-caddy-prod-1
   ```
   In den Startup-Logs verifizieren, dass beide Hosts geladen wurden:
   ```bash
   docker logs infrastructure-caddy-prod-1 --since 2m 2>&1 \
     | grep "enabling automatic TLS certificate management"
   ```
   Erwartung: `domains` enthält `knoedelstube.de` und `www.knoedelstube.de`.

2. **checkdomain → Domain → Basisschutz deaktivieren** (roter Button).
   Checkdomain managt damit das LE-Cert nicht mehr — Voraussetzung für
   externes Cert-Management.

3. **checkdomain → Nameserver-Einstellungen → Haupt-IPv4** auf
   `46.225.112.119` setzen, speichern. „Inklusive www: Ja" pflegt
   automatisch beide Hostnamen. E-Mail-Empfang, SPF, DKIM **nicht
   anfassen** (laufen weiter über checkdomains Mail-Infrastruktur,
   `mx*.secure-mailgate.com`).

4. **Caddy-Logs offen halten**, dann ca. 5–10 Minuten Geduld:
   ```bash
   docker logs infrastructure-caddy-prod-1 -f 2>&1 \
     | grep -iE 'knoedelstube|certificate obtained|challenge'
   ```
   Caddy retry-t ACME alle 60 s, der erste Erfolg kommt, sobald
   Let's-Encrypt-Resolver den neuen A-Record sehen. Erst wenn
   `certificate obtained` für beide Hosts erscheint, im Browser testen.

5. **Verifizieren:**
   - `https://knoedelstube.de` lädt mit gültigem Cert
   - `https://www.knoedelstube.de` lädt mit gültigem Cert
   - Test-Submit eines Formulars → Mail kommt an
   - `dig knoedelstube.de MX +short` zeigt unverändert `mx*.secure-mailgate.com`

### Widerlegte Annahmen aus der Planungsphase

Im Verlauf der Migration empirisch widerlegt — hier dokumentiert, damit der
Irrweg nicht wiederholt wird:

- **„Paketdomain-Bindung muss gelöst werden, bevor externe IP greift."**
  Falsch. Beweis: `craftelicious.de` läuft auf externer Spotify-IP,
  Paketdomain-Bindung im Webhosting ist weiterhin aktiv — funktioniert
  problemlos. Die Bindung beeinflusst die externe IPv4 nicht. Was zählt
  ist der Basisschutz.
- **„CAA-Records bei checkdomain könnten LE-Issue blocken."**
  Falsch. `dig knoedelstube.de CAA @ns.checkdomain.de` liefert nichts,
  checkdomain setzt keine CAA-Records standardmäßig.
- **„`caddy reload` aktiviert die neue Konfig zuverlässig."**
  Falsch im Hetzner-Setup. Reload meldet Erfolg, aber Block bleibt
  inaktiv. Container-Restart ist der ehrliche Apply-Mechanismus, siehe
  Lessons Learned.

### checkdomain-Kundencenter — relevante Einstellungsorte (Referenz)

**Domain-Einstellungen** (Domains → `knoedelstube.de`)
- **Basisschutz**: zentraler Knopf für Cert-Management. AUS = checkdomain
  hält kein eigenes LE-Cert mehr, externes Cert-Management übernimmt.
- **Nameserver-Einstellungen**: Haupt-IPv4 ist der A-Record-Knopf.
  „Inklusive www: Ja" pflegt automatisch beide Hostnamen.
- **E-Mail-Empfang: Über checkdomain** ✅ (NICHT ändern — pflegt automatisch
  die MX-Records zu checkdomains Mail-Infrastruktur)
- SPF aktiv: `v=spf1 include:secure-mailgate.com ?all` (für Versand-Auth
  von checkdomain-Mailservern, NICHT ändern)
- DKIM-Eintrag `cloudpit._domainkey.knoedelstube.de` (für eingehende
  Mail-Authentifizierung, NICHT ändern)

**Paketdomain-Bindung** (Webhosting → Paketdomains → `knoedelstube.de`)
- Bleibt aktiv, nicht anfassen. Beeinflusst externe IP nicht.

### E-Mail-Setup bei checkdomain — wichtige Erkenntnis

Bei checkdomain sind **11 eigenständige E-Mail-Postfächer** angelegt, davon
relevante:

| Postfach                              | Verbrauch | Anmerkung |
| ------------------------------------- | --------- | --------- |
| `info@knoedelstube.de`                | 4 %       | Irenas Hauptpostfach für Anfragen |
| `reservierung@knoedelstube.de`        | 0 %       | bisher ungenutzt |
| `rechnung@knoedelstube.de`            | 0 %       |  |
| `tobias.raible@knoedelstube.de`       | 0 %       |  |
| `info@craftelicious.de`               | 70 %      | (andere Domain, separater Kontext) |
| `prokop@craftelicious.de`             | 58 %      | (andere Domain) |

Die Postfächer hängen am **E-Mail-Service**, **nicht** am Webhosting-Paket.
Das Lösen der Domain aus dem Webhosting-Paket darf die Postfächer also
**nicht** beeinträchtigen — solange "E-Mail-Empfang: Über checkdomain" auf
Bereich 1 erhalten bleibt, leitet checkdomain Mails weiterhin korrekt an
die Postfächer.

### Hygiene-Followups (offen)

- **SEO-Konsolidierung:** Subdomain `knoedelstube.hefangelist.de` per 301
  auf die Hauptdomain redirecten, damit Suchmaschinen nur die echte URL
  indexieren. Im Kilian-Caddyfile die Subdomain aus dem Knödelstube-Block
  entfernen und einen Redirect-Block ergänzen:
  ```caddy
  knoedelstube.hefangelist.de {
      redir https://knoedelstube.de{uri} permanent
  }
  ```
- **AAAA-Records (IPv6):** Falls `kilian.hefangelist.de` einen AAAA hat,
  analog für die Knödelstube-Domains anlegen.
- **Mail-Postfächer auf checkdomain bleiben** wie sie sind. MX-Records
  unverändert, Postfächer hängen am E-Mail-Service, nicht am Webhosting.

## checkdomain — Kosten-Optimierung & Vertragshygiene

### Aufschlüsselung der checkdomain-Verträge

Bei der Analyse der Buchungen 2025/2026 sind **drei separate Verträge**
identifiziert worden, die alle weiterlaufen:

| Vertrag | Frequenz | Kosten | Status | Zweck |
| --- | --- | --- | --- | --- |
| **Neues Webhosting-Paket** | monatl. 8,99 € | ~108 €/Jahr | bleibt | Mailpostfächer (11 Stück), evtl. WordPress |
| **Altes Homepage-Baukasten-Hosting** | quartalsw. 29,70 € | ~119 €/Jahr | **kann sofort weg** | wird seit langem nicht mehr genutzt |
| **Extended PHP Support** | regelmäßig, > 8 € | ~50–100 €/Jahr | **kündigungsreif** | hielt veraltete PHP-Version für die WordPress-Live-Seite — nicht mehr nötig |
| SSL-Zertifikat (Basisschutz) | jährlich | ~30–60 €/Jahr | **deaktiviert 2026-05-11** | LE-Cert wird jetzt von Caddy auf dem Hetzner verwaltet |
| Domain-Verlängerung(en) | jährlich | ~30–50 €/Jahr | bleibt | Domain-Registry-Gebühr |

**Geschätztes jährliches Einsparpotenzial: ~150–200 €.**

Strukturproblem dahinter: checkdomain bündelt Verträge nicht — beim Upgrade
auf das neuere Hosting wurde der alte Baukasten-Vertrag nicht
mitgekündigt, der Extended-PHP-Support ist ein verstecktes Add-on für
abgekündigte PHP-Versionen.

### Kündigungs-Reihenfolge

**Sofort möglich (noch vor Phase 2):**

1. **Altes Homepage-Baukasten-Hosting** kündigen — ist seit langem nicht
   mehr in Verwendung, beeinflusst die aktuelle Live-Seite nicht
   (`dig +short knoedelstube.de` zeigt `91.203.110.239` = Webhosting-Paket,
   nicht Baukasten).
   - Vorab Check: bei checkdomain unter "Websites" / "Baukasten" prüfen,
     ob noch eine Domain mit dem Baukasten verknüpft ist — falls ja,
     vorher entkoppeln.
   - Bei checkdomain unter Übersicht / Meine Daten / Verträge den
     Baukasten-Vertrag finden und "Kündigen" klicken (oder
     Support-Ticket).
   - Kündigungsfrist beachten — typisch 30 Tage zum Vertragsende.

**Jetzt kündigungsreif (nach Phase-2-Live-Gang am 2026-05-11):**

2. **Extended PHP Support** — die WordPress-Live-Seite wird nicht mehr
   gebraucht, Knödelstube-Website läuft komplett auf dem Hetzner. Explizit
   kündigen oder im Webhosting-Paket-Downgrade mitziehen.

3. **SSL-Zertifikat / Basisschutz** — am 2026-05-11 in checkdomain
   deaktiviert. Falls als separater Vertragsposten geführt, zum
   Vertragsende kündigen.

4. **Webhosting-Paket** (optional, später):
   - Behalten (komfortabel, Mailpostfächer + Domain in einer Hand)
   - Oder auf reines Mail-Paket runterstufen, falls günstiger
   - Oder Postfächer zu anderem Mail-Provider umziehen (mehr Aufwand)

### Vor Irena als Erklärung

Beim Besprechen mit der Geschäftsinhaberin (Irena) am besten so framen:

- **Wir zahlen aktuell für zwei Hostings parallel** (alt + neu), das alte
  wird nicht mehr gebraucht.
- **Extra-Gebühr für veraltetes PHP** entfällt mit dem Umzug auf den
  neuen Server, weil die neue Website kein WordPress mehr ist.
- **SSL-Zertifikat** ist beim neuen Setup kostenlos und automatisch.
- **Postfächer und Domain** bleiben wie sie sind, kein Funktionsverlust.
- **Einsparung: 150–200 € pro Jahr** bei gleicher oder besserer Leistung.

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
7. **`caddy reload` ist im Hetzner-Stack nicht zuverlässig** — meldet
   formalen Erfolg (`adapted config to JSON`), aktiviert den neuen Block
   aber nicht im laufenden Caddy-Prozess. Symptom war damals: neue Hostnamen
   blieben unbekannt, ACME wurde nie versucht. Heilung: `docker restart
   infrastructure-caddy-prod-1` (~3 s Cut). Bei künftigen Caddyfile-Patches
   nicht auf reload vertrauen, sondern in den Startup-Logs nach
   `enabling automatic TLS certificate management` mit den erwarteten
   domains prüfen.
8. **checkdomain-Migration: Basisschutz ist der Knopf, nicht die
   Paketdomain-Bindung.** Die ursprüngliche Annahme „Bindung muss zuerst
   gelöst werden" hat einen ganzen Abend an Diagnose gekostet. Empirisch
   widerlegt durch `craftelicious.de` (externe IP, Bindung aktiv, läuft).
   Reihenfolge für künftige Migrationen: Caddy-Block aktivieren →
   Basisschutz aus → IP umbiegen → 5–10 Min warten.

## Ressourcen-Status

- `knoedel-mail` Idle: ~23 MiB RAM, 0 % CPU
- Server gesamt 3,73 GiB RAM, alle Container ~270 MiB → reichlich Luft
- Erwartete Last: < 500 Page Views/Tag, < 20 Form-Submits/Tag
