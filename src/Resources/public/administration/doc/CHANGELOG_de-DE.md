# 1.16.2
- Rückfall-Verhalten: „Nur eigene Elemente“ ohne sichtbaren Inhalt zeigt den Shopware-Inhalt statt einer leeren Spalte (mit Hinweis im Editor); gelöschte Verkaufskanäle und Sprachen werden markiert, lassen sich mit einem Klick entfernen, wirkungslose Layouts werden als solche angezeigt

# 1.16.1
- Unstimmigkeiten bereinigt: Shopware-Teile heißen einheitlich „Von Shopware“ (auch Logos und Fußleiste sind keine Spalten), Knopf „Ausblenden“; Info-Zeile „Konfigurations-Domain“ entfernt; ungenutzte Vorlagen-Reste in der Plugin-Klasse entfernt

# 1.16.0
- Rechte für Admin-Benutzer: eigener Eintrag „DMX4ALL Footer Editor“ unter Inhalte in den Rollen mit Ansehen, Bearbeiten, Erstellen und Löschen; Menü, Seiten und Knöpfe richten sich danach, ohne Bearbeiten-Recht ist der Editor schreibgeschützt

# 1.15.6
- Aufgeräumt: Reste der früheren Einstellungsfelder (Logo-Regeln für sw-system-config-Karten, veraltete Kommentare) entfernt

# 1.15.5
- Einstellungsseite ist jetzt eine Infoseite: die doppelten Felder der Anordnung entfallen (alles wird im Footer Editor eingestellt), neuer Knopf „Footer Editor öffnen“; config.xml bleibt für die Standardwerte bei der Installation

# 1.15.4
- Plugin-Logo vor allen Kartenüberschriften im Footer Editor (Layouts, Anordnung im Footer, Bereiche), wie auf der Einstellungsseite

# 1.15.3
- Unter Einstellungen › Erweiterungen erscheint das Plugin-Icon statt des Zahnrads

# 1.15.2
- Neue, verständliche Plugin-Beschreibung (Deutsch/Englisch) oben in der README und in der Plugin-Liste

# 1.15.1
- Kachelkopf: Knöpfe (Design, Pfeile, Zurück, Ausblenden) laufen nicht mehr über den Kachelrand; lange Titel werden mit … gekürzt

# 1.15.0
- Design je Bereich: Hintergrundfarbe, Innenabstand, Rahmen (Breite, Art, Farbe, Radius), Textfarbe, Schriftgröße und -stärke, Zeilenhöhe, Ausrichtung, Überschriftenfarbe, Linkfarbe, Hover-Farbe und Unterstreichung – für jeden Bereich und jede Standard-Spalte einzeln, mit Live-Vorschau; auch in der Vorschau Desktop sichtbar

# 1.14.8
- Aufgeräumt: ungenutzter Code, Stile und Textbausteine entfernt; Hilfe-Dialog von Editor und Einstellungen nutzt denselben Code; Storefront-CSS wird nur noch einmal je Seite ausgegeben; README (Deutsch/Englisch) neu und aktuell

# 1.14.7
- Lizenz auf MIT umgestellt (composer.json, LICENSE.md, englischer Originaltext und deutsche Übersetzung im Hilfe-Dialog)

# 1.14.6
- Lizenz auf Freeware umgestellt: kostenlose Nutzung in beliebig vielen Shops, auch gewerblich; unveränderte, kostenlose Weitergabe erlaubt; Verkauf nicht erlaubt

# 1.14.5
- „Layout löschen“ aus der Kopfleiste in die Karte „Layouts“ verlegt (neben Duplizieren); Rückfrage nennt den Namen des Layouts

# 1.14.4
- Ein Knopf „Exportieren“ statt zwei: fragt „Dieses Layout“ oder „Alle Layouts“; bei nur einem Layout wird direkt exportiert

# 1.14.3
- Hilfe-Knopf fest auf 18 × 18 px, auch gegen allgemeine Button-Stile der Administration

# 1.14.2
- Hilfe-Dialog: Lizenz jetzt getrennt auf Deutsch und Englisch; umbrochene Zeilen in Anleitung, Changelog und Lizenz werden zu Absätzen bzw. Listenpunkten zusammengefügt statt einzeln angezeigt

# 1.14.1
- Hilfe-Knopf (? im Kreis) vor der Versionsanzeige im Editor: öffnet Anleitung, Changelog und Lizenz auf Deutsch oder Englisch

# 1.14.0
- Layouts für mehrere Verkaufskanäle und Sprachen: Mehrfachauswahl je Layout, genauestes aktives Layout gewinnt; beim Aktivschalten werden gleich genaue, überschneidende Layouts inaktiv; Export/Import mit Listen; bestehende Zuordnungen werden übernommen

# 1.13.0
- Layouts exportieren und importieren: einzelnes oder alle Layouts als JSON-Datei inkl. Anordnung und Bild-Adressen; Import mit Auswahl, legt neue inaktive Layouts an, ordnet unbekannte Verkaufskanäle/Sprachen „Alle“ zu und legt fehlende Bilder über ihre Adresse neu an

# 1.12.0
- Mehrere Layouts: beliebig viele benannte Layouts anlegen, duplizieren, umbenennen und aktiv/inaktiv schalten; je Verkaufskanal und Sprache ist genau eines aktiv; bestehende Layouts heißen „Standard“ und bleiben aktiv

# 1.11.5
- Anzeigename geändert: „DMX4ALL Footer Tool“ heißt jetzt „DMX4ALL Footer Editor“ (Menü, Einstellungen, Plugin-Liste, Hilfetexte); technischer Name Dmx4allFooterTool bleibt, damit Update und gespeicherte Layouts erhalten bleiben

# 1.11.4
- Speicher-Status steht jetzt neben der Versionsnummer, in gleicher Höhe und im gleichen Stil

# 1.11.3
- Verkaufskanäle, Sprachen und Footer-Kategorien: scheitert die normale Suche an einer unlesbaren Server-Antwort, wird sie als schlichtes JSON wiederholt und vorangestellter Text (z. B. PHP-Warnungen) übersprungen; der Anfang der Antwort steht zur Diagnose in der Konsole

# 1.11.2
- Bild-Kachel zeigte trotz Bild „Kein Bild gewählt“, wenn keine Größe eingestellt war (Reihenfolge der Anzeige-Bedingungen)

# 1.11.1
- Einstellungen vollständig auf Deutsch: config.xml nutzt jetzt Englisch als Standard und Deutsch mit lang="de-DE" (vorher fehlte die deutsche Zuordnung, z. B. bei „Neben den Standard-Spalten“); Hilfetexte aktualisiert

# 1.11.0
- Bildgröße einstellbar: Breite in px oder %, Höhe in px, jeweils optional; Seitenverhältnis bleibt erhalten, bei beiden Angaben wird eingepasst statt verzerrt; Größe in Kachel und Vorschau sichtbar; bisherige maximale Breite wird übernommen

# 1.10.1
- Leiste „In einen Bereich ziehen: Text / Bild“ entfernt; Elemente werden über „+ Text“ / „+ Bild“ im jeweiligen Bereich angelegt

# 1.10.0
- Logos und Fußleiste in Einzelteile aufgeteilt: Zahlungslogos, Versandlogos, Service-Menü, MwSt.-Hinweis und Copyright lassen sich einzeln ausblenden, bearbeiten und in die Spaltenzeile holen; bestehende Einstellungen werden übernommen

# 1.9.2
- Absturz im Admin behoben (i.$t is not a function): Texte mit Platzhaltern nutzen jetzt nur noch $tc, das es in Shopware 6.7 gibt

# 1.9.1
- Entfernen ohne Browser-Rückfrage: Elemente werden sofort entfernt und lassen sich 8 Sekunden lang rückgängig machen; alle übrigen Rückfragen als eigener Dialog statt window.confirm, weil Firefox Seiten-Dialoge dauerhaft unterdrücken kann und Knöpfe dann wirkungslos waren

# 1.9.0
- Inhalt der Standard-Spalten bearbeitbar: je Spalte „Inhalt von Shopware“, „Shopware + eigene Elemente“ oder „Nur eigene Elemente“ mit Texten und Bildern per Drag and Drop; eigene Überschrift je Sprache für Hotline und Navigationsspalten; auch ein Layout, das nur Standard-Spalten ändert, wird im Shop angewendet

# 1.8.0
- Automatisches Speichern: Wartezeit einstellbar (Aus, 3, 5, 10, 30, 60 s; Standard 5 s, je Browser gemerkt), Statusanzeige mit Countdown, „Wird gespeichert“, „Gespeichert um …“ und Fehlerzustand; Änderungen während des Speicherns gehen nicht mehr verloren

# 1.7.2
- Automatisches Scrollen beim Ziehen startet erst, wenn der Zeiger den Randbereich einmal verlassen hat; vorher scrollte die Seite beim Anfassen von „Text“/„Bild“ nahe der Kopfleiste sofort weg und das Raster verschwand

# 1.7.1
- Beim Ziehen folgt nur noch ein kleines Schild mit der Bezeichnung rechts unterhalb des Zeigers statt eines Abbilds der ganzen Kachel; Ziel und Einfügelinie bleiben sichtbar, Einfügemarken deutlicher

# 1.7.0
- Zahlungs-/Versandlogos und Fußleiste (Service-Menü, MwSt.-Hinweis, Copyright) als Standard-Teile: bleiben am Standardplatz oder lassen sich in die Spaltenzeile holen, dort frei positionieren, verbreitern und ausblenden

# 1.6.1
- Laden abgesichert: Verkaufskanäle, Sprachen, Layouts, Einstellungen und Footer-Kategorien werden unabhängig geladen; ein Fehler in einem Teil blockiert nicht mehr den ganzen Builder, die Meldung nennt den betroffenen Teil

# 1.6.0
- Alle Footer-Spalten frei positionierbar: Service-Hotline und jede Spalte der Footer-Navigation stehen im Raster, lassen sich verschieben, verbreitern und ausblenden; Vorschau zeigt sie mit; Platzhalter in Hinweistexten und Umbruch der Links behoben

# 1.5.1
- Vorschau Desktop zeigt die echten Inhalte (Texte in der gewählten Sprache, Bilder mit Ausrichtung) und aktualisiert sich bei jeder Änderung; leere Elemente zählen wie im Shop nicht mit

# 1.5.0
- Bereiche frei positionierbar: Breite je Bereich (1 bis 12 Spalten oder ganze Breite), Bereiche am Titel per Drag and Drop umstellen, Admin-Raster zeigt die Desktop-Spalten wie im Shop

# 1.4.0
- Anzahl der Bereiche dynamisch: Bereiche hinzufügen (bis 24), entfernen und verschieben; neue Layouts starten mit 4 Bereichen; bis zu 12 Spalten

# 1.3.3
- Abgelegte Elemente landen sofort im Bereich, ohne Dialog, der die Bereiche verdeckt; leere Elemente sind markiert; Ziehen gegen Browser-Drag und fremde Event-Handler abgesichert

# 1.3.2
- Ziehen komplett neu über Pointer-Events statt HTML5-Drag-and-Drop: Elemente bleiben sichtbar, ein Abbild folgt dem Mauszeiger, automatisches Scrollen am Rand, Abbrechen mit Esc, funktioniert auch per Touch

# 1.3.1
- Drag and Drop behoben: gezogene Elemente verschwanden, weil sich das DOM schon beim Start des Ziehens änderte; Einfügemarke verschiebt keine Elemente mehr; Bilder in der Vorschau lösen keinen eigenen Browser-Drag mehr aus

# 1.3.0
- Inhalte übersetzbar: Texte, Alternativtexte und Links je Sprache mit Sprach-Reitern im Bearbeiten-Dialog, Rückfall auf die Standardsprache, Hinweis auf fehlende Übersetzungen im Raster

# 1.2.0
- Anordnung einstellbar: eigene Karte „Anordnung im Footer“ mit Vorschau, Reihenfolge (zuerst/zwischen/zuletzt), Hotline und Navigation ein-/ausblendbar, Werte je Verkaufskanal mit Vererbung; alle Texte als Snippets auf Deutsch und Englisch (Admin und Storefront)

# 1.1.1
- Fehler behoben: Twig-Fehler "Unclosed comment" in columns.html.twig (CSS-Regel {#footerColumns wurde als Twig-Kommentar gelesen)

# 1.1.0
- Neue Position „Neben den Standard-Spalten“ (jetzt Standard): befüllte Bereiche stehen als weitere Spalten neben Hotline und Footer-Navigation; bestehende Installationen mit „Ersetzen“ werden beim Update umgestellt

# 1.0.0
- Erste Version: 8 Footer-Bereiche mit Text und Bild per Drag and Drop, 4 Spalten als Standard
