const RESERVATION_BODY = `Hallo {name},

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
Telefon: 07131/2035557 · info@knoedelstube.de`;

const fill = (tpl, vars) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v && v.length > 0 ? v : '–'), tpl);

export function renderReservation({ name, telefon, personen, uhrzeit, datum, nachricht }) {
  const subject = `Reservierung ${datum} – ${name} (${personen})`;
  const text = fill(RESERVATION_BODY, { name, datum, uhrzeit, personen, telefon, nachricht });
  return { subject, text };
}

export function renderContact({ name, email, betreff, nachricht }) {
  const subject = `Kontaktformular: ${betreff}`;
  const text =
    `Name:    ${name}\n` +
    `E-Mail:  ${email}\n` +
    `Betreff: ${betreff}\n\n` +
    `Nachricht:\n${nachricht || '–'}\n\n` +
    `---\nDiese Anfrage wurde über das Kontaktformular auf www.knoedelstube.de übermittelt.\n` +
    `Eine Antwort direkt an den Gast ist per Reply möglich.`;
  return { subject, text };
}
