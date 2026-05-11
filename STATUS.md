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
  A-Records, kein CNAME-Konstrukt → "Inklusive www: Ja" in checkdomain
  pflegt automatisch beide.
- Die IP `91.203.110.239` ist eine **checkdomain-Webhosting-Server-IP**, kein
  externer Hoster — die alte Live-Seite läuft im Webhosting-Paket von
  checkdomain selbst, im Verzeichnis `/knoedelstube.de`.

### checkdomain-Kundencenter — relevante Einstellungsorte

**Bereich 1: Nameserver-Einstellungen** (Domains → `knoedelstube.de` → Nameserver)
- Modus: "checkdomain Nameserver verwenden" ✅
- TTL: 300 s ✅
- "Inklusive www: Ja" ✅
- **Haupt-IP-Adresse (IPv4): `91.203.110.239`** ← muss auf `46.225.112.119`
- "E-Mail-Empfang: Über checkdomain" ✅ (NICHT ändern — pflegt automatisch
  die MX-Records zu checkdomains Mail-Infrastruktur)
- SPF aktiv: `v=spf1 include:secure-mailgate.com ?all` (für Versand-Auth
  von checkdomain-Mailservern, NICHT ändern)
- DKIM-Eintrag `cloudpit._domainkey.knoedelstube.de` (für eingehende
  Mail-Authentifizierung, NICHT ändern)

**Bereich 2: Paketdomains verwalten** (Webhosting → Paketdomains → `knoedelstube.de`)
- Verwendung: "Nutzung im Webhosting-Paket (Verzeichnis): `/knoedelstube.de`"
- **Genau diese Bindung ist der Grund**, warum die A-Record-IP auf
  checkdomains Webhosting-Server zeigt. Solange die Bindung aktiv ist,
  überschreibt checkdomain die manuell gesetzte IP auf Bereich 1.
- **Diese Bindung muss zuerst gelöst werden**, bevor die IP auf einen
  externen Server (Hetzner) zeigen kann.
- Dropdown-Optionen aktuell unbekannt — vermutlich: Webhosting-Paket /
  Frame-Weiterleitung / Permanente Weiterleitung. Falls keine Option
  "Externer Server"/"Externe Nutzung" vorhanden: Support-Anfrage bei
  checkdomain stellen.

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

### Sicherheits-Checks für die Migration

**Vor der Änderung — MX-Records dokumentieren:**
```bash
dig knoedelstube.de MX +short
```
Wert notieren (vermutlich `mx*.checkdomain.de` oder ähnlich).

**Nach der Änderung — verifizieren, dass MX unverändert:**
```bash
dig knoedelstube.de MX +short
```
Soll denselben Wert zurückgeben wie vorher.

**Mail-Funktion testen:**
- Testmail an `info@knoedelstube.de` schicken (von externer Adresse)
- In Irenas Postfach prüfen, ob sie ankommt
- Falls nicht: ggf. "E-Mail-Empfang: Über checkdomain" auf Bereich 1 noch
  einmal speichern, damit MX-Records neu geschrieben werden

### Worst-Case-Rollback

Falls etwas schiefgeht (Website weg, Mails kommen nicht an):
1. Bereich 2 (Paketdomains): Domain wieder ins Webhosting-Paket einhängen
2. Bereich 1 (Nameserver): IP auf `91.203.110.239` zurücksetzen
3. Mit TTL 300 ist nach 5 Minuten der Zustand vor dem Umzug wieder aktiv

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

5. **DNS-Umzug bei checkdomain** — zweistufig wegen Webhosting-Paket-Bindung:

   **5a) Domain aus Webhosting-Paket lösen** (Bereich 2, "Paketdomains verwalten")
   - Wenn Dropdown "Externer Server" / "Externe Nutzung" o.ä. vorhanden:
     auswählen und speichern.
   - Wenn nicht: checkdomain-Support kontaktieren mit Bitte um Entkopplung
     der Domain vom Webhosting-Paket bei Erhalt der E-Mail-Postfächer.

   **5b) A-Record umstellen** (Bereich 1, "Nameserver-Einstellungen")
   - Haupt-IP-Adresse (IPv4): `91.203.110.239` → `46.225.112.119`
   - "Inklusive www: Ja" beibehalten — pflegt automatisch beide Hostnamen
   - TTL bleibt 300 s
   - "E-Mail-Empfang: Über checkdomain" **NICHT** anfassen
   - SPF + DKIM (`cloudpit._domainkey`) **NICHT** anfassen
   - Speichern

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

- Mail-Forwards/Aliase auf der Domain verifizieren — nur DNS umbiegen
  reicht, wenn alle Postfächer echte checkdomain-Konten sind (verifiziert
  via Postfach-Liste). MX-Records bei checkdomain bleiben unverändert.
- AAAA-Records (IPv6): aktuell hat `kilian.hefangelist.de` einen AAAA?
  Falls ja, analog für die Knödelstube-Domains anlegen.

## checkdomain — Kosten-Optimierung & Vertragshygiene

### Aufschlüsselung der checkdomain-Verträge

Bei der Analyse der Buchungen 2025/2026 sind **drei separate Verträge**
identifiziert worden, die alle weiterlaufen:

| Vertrag | Frequenz | Kosten | Status | Zweck |
| --- | --- | --- | --- | --- |
| **Neues Webhosting-Paket** | monatl. 8,99 € | ~108 €/Jahr | bleibt | Mailpostfächer (11 Stück), evtl. WordPress |
| **Altes Homepage-Baukasten-Hosting** | quartalsw. 29,70 € | ~119 €/Jahr | **kann sofort weg** | wird seit langem nicht mehr genutzt |
| **Extended PHP Support** | regelmäßig, > 8 € | ~50–100 €/Jahr | **weg nach Phase 2** | hält veraltete PHP-Version für aktuelle WordPress-Live-Seite am Leben |
| SSL-Zertifikat | jährlich | ~30–60 €/Jahr | **weg nach Phase 2** | wird durch Let's Encrypt auf dem Hetzner überflüssig |
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

**Nach erfolgreichem Phase-2-Live-Gang:**

2. **Extended PHP Support** — entfällt, sobald die alte WordPress-Live-Seite
   nicht mehr gebraucht wird (= sobald `knoedelstube.de` auf Hetzner zeigt).
   Vermutlich kündigt das sich automatisch mit Webhosting-Paket-Downgrade,
   sonst explizit kündigen.

3. **SSL-Zertifikat** — Caddy auf dem Hetzner liefert kostenlose
   Let's-Encrypt-Certs. Das gekaufte Zertifikat einfach auslaufen lassen
   oder zum Vertragsende kündigen.

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

## Ressourcen-Status

- `knoedel-mail` Idle: ~23 MiB RAM, 0 % CPU
- Server gesamt 3,73 GiB RAM, alle Container ~270 MiB → reichlich Luft
- Erwartete Last: < 500 Page Views/Tag, < 20 Form-Submits/Tag
