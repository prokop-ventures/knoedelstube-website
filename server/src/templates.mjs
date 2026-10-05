// Nur die Reservierungsdaten – kein Antworttext, keine Signatur. Das Skript im
// Postfach liest die Felder zeilenweise aus; eine zweite Zeile "Telefon:" mit
// der Nummer der Knödelstube landete sonst als Gastnummer im Kalender.
const RESERVATION_BODY = `Reservierungsübersicht:
Name:      {name}
Datum:     {datum}
Uhrzeit:   {uhrzeit} Uhr
Personen:  {personen}
Telefon:   {telefon}
E-Mail:    {email}
Nachricht: {nachricht}

---
Diese Anfrage wurde über das Reservierungsformular auf www.knoedelstube.de übermittelt.
Eine Antwort direkt an den Gast ist per Reply möglich.`;

const fill = (tpl, vars) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v && v.length > 0 ? v : '–'), tpl);

export function renderReservation({ name, email, telefon, personen, uhrzeit, datum, nachricht }) {
  const subject = `Reservierung ${datum} – ${name} (${personen})`;
  const text = fill(RESERVATION_BODY, { name, datum, uhrzeit, personen, telefon, email, nachricht });
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
