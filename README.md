# DMX4ALL Footer Editor

**Der Footer deines Shops – so, wie du ihn haben möchtest.**

Mit dem Shopware Footer Editor gestaltest du den unteren Bereich deines
Shopware-Shops ganz ohne Programmierkenntnisse. Du legst eigene Bereiche an,
füllst sie mit Texten und Bildern und ordnest alles per Drag and Drop so an,
wie es zu deinem Shop passt – nebeneinander, untereinander oder über die
ganze Breite.

Auch die bekannten Teile von Shopware, etwa die Service-Hotline, die
Informations-Links, die Zahlungs- und Versandlogos oder das Copyright, lassen
sich verschieben, ergänzen, ersetzen oder ausblenden. Jeder Bereich bekommt
auf Wunsch sein eigenes Aussehen: Hintergrundfarbe, Rahmen, Schrift und
Linkfarben.

**Das Wichtigste auf einen Blick**

- Eigene Bereiche mit Texten und Bildern, einfach per Drag and Drop anordnen
- Alle Standard-Teile des Shopware-Footers frei positionieren und bearbeiten
- Design je Bereich: Farben, Rahmen, Schrift und Links
- Mehrere Layouts, z. B. für Weihnachten oder Aktionen, mit einem Klick
  aktivieren
- Unterschiedliche Layouts je Verkaufskanal und Sprache, Texte übersetzbar
- Vorschau im Admin, automatisches Speichern, Export und Import
- Funktioniert auf Desktop, Tablet und Smartphone

---

## Übersicht

Gestaltet den Storefront-Footer von Shopware 6.7 frei: eigene Bereiche mit
Texten und Bildern, dazu alle Standard-Teile von Shopware, die sich
verschieben, verbreitern, bearbeiten oder ausblenden lassen.

**Aufruf:** Inhalte › DMX4ALL Footer Editor

## Layouts

- Beliebig viele Layouts anlegen, duplizieren, benennen und löschen,
  z. B. „Standard“, „Weihnachten“, „Sale“.
- Jedes Layout gilt für ausgewählte **Verkaufskanäle** und **Sprachen**
  (Mehrfachauswahl, „Alle“ = keine Einschränkung).
- Neue Layouts sind zunächst **inaktiv**. Im Shop gilt je Verkaufskanal und
  Sprache das genaueste aktive Layout: bestimmte Verkaufskanäle vor
  bestimmten Sprachen vor „Alle“. Wird ein Layout aktiv geschaltet, werden
  gleich genaue Layouts mit Überschneidung inaktiv.
- **Exportieren** speichert das geöffnete oder alle Layouts als JSON-Datei
  (inklusive Anordnung und Bild-Adressen). **Importieren** legt daraus neue,
  inaktive Layouts an; unbekannte Verkaufskanäle oder Sprachen werden zu
  „Alle“, fehlende Bilder werden über ihre Adresse neu angelegt.

## Bereiche und Elemente

- Bereiche anlegen („Bereich hinzufügen“, bis 24), am Titel per Drag and Drop
  umstellen und je Bereich die **Breite** wählen (1–12 Spalten oder ganze
  Breite).
- Elemente mit „+ Text“ / „+ Bild“ anlegen, per Drag and Drop verschieben,
  per Doppelklick oder Stift bearbeiten. Entfernte Elemente lassen sich einige
  Sekunden lang rückgängig machen.
- **Texte**, Alternativtexte und Links werden je Sprache gepflegt; fehlt eine
  Übersetzung, zeigt der Shop die Standardsprache.
- **Bilder**: hochladen oder aus der Medienverwaltung wählen, mit Link,
  Größe (Breite in px oder %, Höhe in px) und Ausrichtung.

## Design je Bereich

Über das Farbfeld im Kopf jedes Bereichs (auch bei Standard-Spalten in der
Zeile) öffnet sich der Design-Dialog mit Live-Vorschau:

- Hintergrund und Rahmen: Hintergrundfarbe, Innenabstand, Rahmenbreite,
  -art und -farbe, Eckenradius
- Text: Textfarbe, Schriftgröße, Schriftstärke, Zeilenhöhe, Ausrichtung,
  Überschriftenfarbe
- Links: Linkfarbe, Farbe beim Überfahren, Unterstreichung normal und beim
  Überfahren

Leere Felder übernehmen das Aussehen des Themes. Jeder Bereich wird für sich
gestaltet.

## Teile von Shopware

Bei der Position „Neben den Standard-Spalten“ stehen im Raster auch:

- Service-Hotline und jede Spalte der Footer-Navigation,
- Zahlungslogos, Versandlogos, Service-Menü, MwSt.-Hinweis und Copyright
  (zunächst an ihrem Standardplatz unter der Spaltenzeile, auf Wunsch in der
  Zeile).

Jeder Teil lässt sich verschieben, verbreitern und ausblenden. Sein Inhalt
kann bleiben („Inhalt von Shopware“), ergänzt („Shopware + eigene Elemente“)
oder ersetzt werden („Nur eigene Elemente“). Hotline und Navigationsspalten
können eine eigene Überschrift je Sprache bekommen.

## Anordnung

Karte **Anordnung im Footer** mit Desktop-Vorschau:

| Einstellung               | Standard                   |
|---------------------------|----------------------------|
| Eigenen Footer anzeigen   | an                         |
| Position                  | Neben den Standard-Spalten |
| Spalten am Desktop        | 4                          |
| Spalten am Tablet         | 2                          |
| Spalten am Smartphone     | 1                          |
| Leere Bereiche ausblenden | aus                        |

Die Werte gelten je Verkaufskanal; ein Verkaufskanal speichert nur seine
Abweichungen von „Alle“. Eingestellt wird alles im Footer Editor; die Seite
unter Einstellungen › Erweiterungen zeigt nur noch Infos, Support und Hilfe. Weitere Positionen: Standard-Spalten ersetzen, über
oder unter den Standard-Spalten.

## Speichern

- „Speichern“ sichert Layout und Anordnung und leert danach den Shop-Cache.
- „Automatisch speichern“: Aus, 3, 5 (Standard), 10, 30 oder 60 Sekunden nach
  der letzten Änderung; die Wahl merkt sich der Browser. Der Status steht
  neben der Versionsnummer.

## Rückfall-Verhalten

- Kein passendes aktives Layout, Plugin aus oder Fehler: Der Shop zeigt den
  normalen Shopware-Footer.
- Fehlende Übersetzung: Standardsprache, sonst erste vorhandene Übersetzung.
- „Nur eigene Elemente“ ohne sichtbaren Inhalt (z. B. kein Text in dieser
  Sprache oder Bild gelöscht): Der Shop zeigt den Inhalt von Shopware.
- Gelöschte Bilder entfallen; leere oder ungültige Design-Werte übernehmen
  das Theme.
- Gelöschte Verkaufskanäle oder Sprachen werden im Editor markiert und lassen
  sich mit einem Klick entfernen. Ein Layout, das nur noch gelöschten
  Einträgen zugeordnet ist, wirkt im Shop nirgends und wird als „wirkungslos“
  angezeigt.

## Rechte

Unter Einstellungen › Benutzer & Rechte › Rollen gibt es im Bereich
„Inhalte“ den Eintrag **DMX4ALL Footer Editor**:

| Recht     | Erlaubt                                                        |
|-----------|----------------------------------------------------------------|
| Ansehen   | Footer Editor öffnen, Layouts ansehen und exportieren          |
| Bearbeiten| Bereiche, Elemente, Design und Anordnung ändern und speichern  |
| Erstellen | neue Layouts anlegen, duplizieren und importieren              |
| Löschen   | Layouts löschen                                                |

Ohne „Bearbeiten“ zeigt der Editor einen Hinweis und sperrt alle Eingaben.
Administratoren haben automatisch alle Rechte.

## Technik

- Tabelle `dmx4all_footer_tool_layout` (Name, Status, Verkaufskanäle,
  Sprachen, Layout als JSON)
- Twig-Funktion `dmx4all_footer_tool()`, Blöcke des Footer-Templates werden
  erweitert; das Storefront-CSS steht inline, ein Theme-Compile ist nicht nötig
- Admin-JS ohne Node/npm-Build; Texte in
  `src/Resources/app/administration/src/snippet/` (Deutsch/Englisch), von
  `sync-admin.sh` in das Admin-Asset eingebettet
- Storefront-Texte in `src/Resources/snippet/`

## Entwicklung

```bash
./bump.sh patch "Was geändert wurde"   # Version hochzählen, Changelog, Admin-Asset
./pack.sh                              # build/Dmx4allFooterTool-<Version>.zip
```

Nach der Installation: `bin/console assets:install` und
`bin/console cache:clear`.

## Lizenz

MIT, siehe `LICENSE.md`.
