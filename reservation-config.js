// Konfiguration für das Reservierungsformular
// Diese Datei kann unabhängig vom restlichen HTML gepflegt werden.

const RESERVATION_CONFIG = {

  // Web3Forms Access Key – nach Registrierung auf web3forms.com eintragen
  web3forms_key: 'a15bfa54-c1cf-4675-a37f-d5f64d43979d',

  // Empfänger-E-Mail (muss mit dem Web3Forms-Konto übereinstimmen)
  to_email: 'info@knoedelstube.de',

  // Betreff-Vorlage – {datum} wird ersetzt
  subject: 'Reservierung {datum}',

  // E-Mail-Text an Irena – Platzhalter: {name}, {datum}, {uhrzeit}, {personen}, {telefon}, {nachricht}
  message_template: `Hallo {name},

vielen Dank für Ihre Reservierung in der Knödelstube Heilbronn.
Wir freuen uns, Sie und Ihre Begleitung am {datum}, um {uhrzeit} Uhr bei uns begrüßen zu dürfen.
Sollte sich die Personenzahl ändern oder Sie die Reservierung nicht wahrnehmen können, bitten wir Sie, uns rechtzeitig zu informieren oder zu
stornieren – gerne telefonisch unter 07131/2035557 oder per E-Mail an info@knoedelstube.de.
Wir halten Ihren Tisch 15 Minuten nach der reservierten Uhrzeit frei.
Wir wünschen Ihnen schon jetzt einen angenehmen Abend bei böhmischen Knödeln, tschechischem Bier und herzlicher Atmosphäre.

Mit freundlichen Grüßen
Ihr Team Knödelstube
Fischergasse 9 · 74072 Heilbronn
Telefon: 07131/2035557
E-Mail: info@knoedelstube.de
Web: www.knoedelstube.de

Reservierungsübersicht:
Name:      {name}
Datum:     {datum}
Uhrzeit:   {uhrzeit} Uhr
Personen:  {personen}
Telefon:   {telefon}
Nachricht: {nachricht}

---
Diese Anfrage wurde über das Reservierungsformular auf www.knoedelstube.de übermittelt.
Eine Antwort direkt an den Gast ist per Reply möglich.

Knödelstube · Fischergasse 9 · 74072 Heilbronn
Telefon: 07131/2035557 · info@knoedelstube.de`,

};
