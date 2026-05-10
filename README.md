# Knödelstube-Website — Arbeiten mit Claude Code

Diese Website wird mit **Claude Code** in der Claude Desktop App gepflegt. Du
beschreibst, was du geändert haben willst — Claude schreibt den Code,
startet den Server, prüft das Ergebnis und kann es auch live deployen.

Dieses README ist eine Sammlung von Prompts (= Anweisungen an Claude) für
die häufigsten Aufgaben. Du musst keine HTML-/CSS-Kenntnisse haben — kopier
einen Prompt, pass die Werte an, schick's an Claude.

---

## Erstmal Claude Code starten

1. **Claude Desktop App** öffnen.
2. Im linken Bereich auf den **Projekt-/Ordner-Button** und den Ordner
   `knoedelstube-website` öffnen (das geklonte Repo auf deinem Mac).
3. Sobald der Ordner offen ist, kannst du Claude Anweisungen geben, die
   diesen Ordner betreffen.

Falls du das Projekt noch nicht auf dem Rechner hast, erste Anweisung:

> *"Bitte klone das Repository `knoedelstube-website` von GitHub in meinen
> `~/Projekte`-Ordner und öffne es."*

Claude richtet alles ein.

---

## Lokalen Vorschau-Server starten

Bevor du Änderungen machst, willst du die Site lokal sehen. Dafür gibt's
einen kleinen Server.

> *"Starte den lokalen Vorschau-Server für die Website."*

Claude führt `node serve.mjs` aus. Danach kannst du im Browser
[http://localhost:3000](http://localhost:3000) öffnen.

Wenn der Server läuft und du was änderst, einfach im Browser **Cmd + R**
(neu laden) — die Änderung ist sofort sichtbar.

Server stoppen, wenn du fertig bist:

> *"Stoppe den lokalen Server."*

---

## Aktuellen Stand vom Server holen

Bevor du Änderungen machst, immer erst den neuesten Stand holen:

> *"Hol den aktuellen Stand der Website vom GitHub-Repo."*

Claude führt `git pull` aus.

---

## Häufige Aufgaben — Beispiel-Prompts

### Speisekarte aktualisieren — neue SVGs einbauen

Die Speisekarte besteht aus zwei Tabs: "Saisonale Spezialitäten" und
"Speisekarte". Jeder Tab zeigt mehrere SVG-Bilder (eine Seite pro SVG).

**Bilder liegen unter:**
- `images/speisekarte/saisonale-karte/` — z.B. `1.svg`, `2.svg`
- `images/speisekarte/sommerkarte/` — z.B. `2.svg` bis `7.svg`

**Beispiel: Du hast neue SVGs für die Sommerkarte bekommen.**

> *"Ich habe die neuen Sommerkarten-SVGs auf den Schreibtisch gelegt
> (`~/Desktop/sommerkarte-neu/1.svg` bis `5.svg`). Tausch bitte die
> bestehenden Sommerkarten-Bilder im Ordner `images/speisekarte/sommerkarte/`
> dadurch aus, sodass die Speisekarte fünf Seiten in dieser Reihenfolge
> zeigt: 1=Vorspeisen, 2=Knödelküche, 3=Hauptgerichte, 4=Desserts,
> 5=Getränke. Aktualisiere wenn nötig die `alt`-Texte und die
> Anzahl-Konstante im Code."*

**Beispiel: Eine zusätzliche Seite einfügen.**

> *"Füge eine neue Seite zur saisonalen Karte hinzu — die SVG-Datei heißt
> `3.svg` und liegt schon unter `images/speisekarte/saisonale-karte/`. Sie
> soll als dritte Seite nach 'Limos & Longdrinks' erscheinen, alt-Text
> 'Tagesempfehlungen'."*

### Öffnungszeiten ändern

Die Öffnungszeiten stehen an mehreren Stellen (Hero-Bereich, Footer-Bereich,
ggf. mehr). Lass Claude alle Stellen einheitlich pflegen.

**Beispiel:**

> *"Ändere die Öffnungszeiten an allen Stellen auf der Website auf:
> Dienstag bis Freitag 17:00–22:00, Samstag und Sonntag 12:00–22:00,
> Montag Ruhetag. Such alle Vorkommen und passe sie konsistent an."*

**Beispiel: temporäre Änderung (Urlaub).**

> *"Wir machen vom 15. bis 28. Mai Betriebsurlaub. Füge einen gut sichtbaren
> Hinweis-Banner ganz oben auf der Seite ein: 'Vom 15. bis 28. Mai machen
> wir Pause. Ab dem 29. Mai sind wir wieder für euch da.' Und sperre im
> Reservierungs-Datepicker diesen Zeitraum (siehe Datepicker-Abschnitt)."*

### Reservierungs-Datepicker — Tage sperren

Der Datepicker sperrt aktuell automatisch alle **Sonntage und Montage**
(unsere Ruhetage). Sondersperren (Urlaub, Feiertage, Privatveranstaltungen)
sind extra zu pflegen.

**Beispiel: Einzelne Tage sperren.**

> *"Sperre im Reservierungs-Datepicker zusätzlich folgende Tage: 24.
> Dezember 2026, 25. Dezember 2026, 31. Dezember 2026 und 1. Januar 2027.
> Bestehende Sperren von Sonntagen und Montagen sollen weiter gelten."*

**Beispiel: Zeitraum sperren.**

> *"Sperre im Datepicker den Zeitraum 15. Mai bis 28. Mai 2026
> (Betriebsurlaub)."*

**Beispiel: Sperren wieder aufheben.**

> *"Entferne die Datepicker-Sperre für Mai — wir öffnen früher wieder."*

### Telefonnummer / Adresse / Kontaktdaten ändern

Solche Werte stehen oft mehrfach im Code. Claude findet alle Stellen und
ändert sie konsistent.

> *"Aktualisiere die Telefonnummer überall von `07131/2035557` auf
> `07131/9876543`. Such alle Vorkommen — auch in Texten und in
> Fehlermeldungen der Formulare."*

### Bewertung ergänzen

Im Bereich "Bewertungen" laufen mehrere Kundenstimmen als Slider durch.

> *"Füge eine neue Bewertung im Bewertungs-Slider hinzu, vor der bestehenden
> ersten Bewertung:
>
> Name: Frau Schmidt
> Sterne: 5
> Text: 'Endlich wieder echte böhmische Knödel in Heilbronn! Die Atmosphäre
> ist herzlich, das Essen authentisch und die Portionen großzügig.
> Kommen sicher wieder.'"*

### Bilder austauschen

> *"Tausche das Theken-Bild im Reservierungs-Bereich gegen
> `~/Desktop/theke-neu.jpeg` aus. Speichere das neue Bild als
> `images/theke-neu.jpeg` und verweise im HTML darauf — den alten
> Bilddateinamen bitte behalten und nicht löschen, falls wir
> zurückwechseln müssen."*

### Texte ändern

> *"Im 'Über uns'-Bereich den Text anpassen: ergänze einen Absatz über
> unsere wöchentlich wechselnden Tagesgerichte zwischen dem bestehenden
> Mission-Text und dem nächsten Bereich. Tonalität wie der Rest der Seite —
> herzlich, bodenständig, kurz."*

### Reservierungs-Limit anpassen (Personenanzahl)

> *"Erweitere im Reservierungsformular die Auswahl 'Personen' so, dass
> auch '21–30 Personen' gewählt werden kann. Wir bekommen vermehrt
> Anfragen für Vereine."*

### Saisonale Banner / Aktion einblenden

> *"Schalte den Aktions-Banner 'Schwäbisches Spargelfest 1. Mai bis 15.
> Juni' im oberen Bereich der Speisekarten-Sektion ein. Der Banner soll
> nur angezeigt werden, wenn das aktuelle Datum innerhalb dieses Zeitraums
> liegt — danach automatisch ausblenden, ohne dass ich was tun muss."*

### Farb- oder Style-Anpassung

Die Marken-Farbe ist ein dunkles Teal (`#215B63`). Claude weiß, wo
welche Farben verwendet werden.

> *"Mach den Reservierungs-Button im Header etwas auffälliger — z.B.
> mit einem dezenten Glüh-Effekt beim Hovern. Soll aber elegant bleiben,
> nicht aufdringlich."*

---

## Änderungen prüfen

Nach jeder Änderung schaut Claude normalerweise selbst nach, ob's
funktioniert hat — er macht z.B. einen Screenshot oder vergleicht den
Code. Du selbst schaust:

1. Im Browser auf [http://localhost:3000](http://localhost:3000)
2. **Cmd + R** drücken
3. Änderung kontrollieren
4. Auch in **schmaler Browser-Breite** prüfen (Fenster schmal ziehen)

Wenn was nicht passt:

> *"Der neue Banner ist zu groß und überdeckt das Logo. Mach ihn schlanker
> und etwas weiter unten."*

---

## Live nehmen (Deployen)

Wenn alles passt, soll's live. Einfach:

> *"Commite die Änderungen mit einer aussagekräftigen Beschreibung und
> deploye sie auf die Live-Site."*

Claude führt aus:
1. `git add` für die geänderten Dateien
2. `git commit` mit einer passenden Nachricht
3. `git push` — das löst automatisch den Deploy aus

Nach 1–3 Minuten ist die Änderung live unter
[knoedelstube.hefangelist.de](https://knoedelstube.hefangelist.de).

Im Browser **Cmd + R** drücken — fertig.

### Wenn der Deploy fehlschlägt

> *"Der Deploy ist fehlgeschlagen. Schau im GitHub-Actions-Log nach,
> woran's liegt, und korrigiere es."*

### Live-Änderung rückgängig machen

> *"Mach die letzte live geschaltete Änderung rückgängig — sie ist beim
> Restaurant nicht gut angekommen."*

Claude macht ein `git revert` und pusht das. Nach ein paar Minuten ist
der vorherige Zustand wieder live.

---

## Tipps für gute Prompts

**Konkret sein, nicht ungefähr.**
- ❌ "Mach die Speisekarte schöner."
- ✅ "Ändere die Hintergrundfarbe der Speisekarten-Karten von Weiß auf
  ein leicht cremiges Beige (`#fdfaf5`), und mach die Schrift im Tab
  einen Tick größer."

**Sag, wo gemessen werden kann.**
- ❌ "Ändere die Öffnungszeiten."
- ✅ "Ändere die Öffnungszeiten an allen Stellen auf Dienstag bis Freitag
  17:00–22:00, Samstag und Sonntag 12:00–22:00. Bitte alle Vorkommen
  konsistent."

**Erstmal lokal, dann live.**
Außer es ist ein Tippfehler oder ein Notfall: erst lokal mit "Cmd + R"
prüfen, dann live nehmen. Sag Claude einfach:
- *"Mach die Änderung erstmal nur lokal und zeig mir, was rauskommt."*
- … später, wenn alles passt: *"Sieht gut aus, deploye es."*

**Bei Unsicherheit fragen lassen.**
Wenn du nicht sicher bist, ob's eindeutig ist:
- *"Bitte erstmal nicht direkt umsetzen — frag mich, wenn etwas
  unklar ist."*

**Größere Umbauten in Schritten.**
Statt "Mach die ganze Seite mobil-freundlicher" lieber:
- *"Schau dir den Reservierungs-Bereich auf einem schmalen Display an —
  was ist da nicht ideal? Wir gehen das dann Schritt für Schritt durch."*

---

## Was diese Anleitung nicht abdeckt

- **Server-Setup auf dem Hetzner** — siehe `SETUP.md` und `STATUS.md`
- **Mail-Service entwickeln** (`server/`-Ordner) — Backend-Code, separate
  Pflege
- **Live-Schaltung der echten Domain `knoedelstube.de`** — siehe
  `STATUS.md`, Phase 2

Bei allem, was über die Standard-Anpassungen hinausgeht, einfach Claude
fragen. Es gibt nahezu keine Aufgabe, die zu unklar zum Anfangen wäre.
