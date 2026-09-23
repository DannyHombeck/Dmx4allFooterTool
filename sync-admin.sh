#!/usr/bin/env bash
#
# Kopiert das Administrations-JS an die Stelle, von der Shopware es laedt.
#
# Die Datei wird nicht gebaut, sondern 1:1 uebernommen. Deshalb muss sie
# browserfertig sein: kein import/export, kein JSX, keine .twig-Imports.
#
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_NAME="$(basename "$PLUGIN_DIR")"

# Bundle-Name in Kleinbuchstaben, so heisst der Ordner unter public/bundles/
FLAT="$(printf '%s' "$PLUGIN_NAME" | tr '[:upper:]' '[:lower:]')"

SOURCE="$PLUGIN_DIR/src/Resources/app/administration/src/main.js"
TARGET_DIR="$PLUGIN_DIR/src/Resources/public/administration/assets"
TARGET="$TARGET_DIR/${FLAT}.js"

if [ ! -f "$SOURCE" ]; then
    echo "Fehler: $SOURCE fehlt." >&2
    exit 1
fi

if grep -Eq '^[[:space:]]*(import|export)[[:space:]]' "$SOURCE"; then
    echo "Fehler: $SOURCE enthaelt import/export." >&2
    echo "  Diese Datei wird nicht gebaut und muss ohne Module auskommen." >&2
    exit 1
fi

if ! node --check "$SOURCE" 2>/dev/null; then
    if command -v node > /dev/null 2>&1; then
        echo "Fehler: $SOURCE ist syntaktisch nicht gueltig." >&2
        exit 1
    fi
    echo "Hinweis: node nicht vorhanden, Syntaxpruefung uebersprungen."
fi

mkdir -p "$TARGET_DIR"

# Dokumente base64-kodiert in das Asset schreiben.
# base64 statt Text, damit keine Anfuehrungszeichen oder Zeilenumbrueche
# maskiert werden muessen - das ginge in reinem Bash schnell schief.
DOC_LINE="    var DOC_DATA = {"

for doc in README.md README_en-GB.md CHANGELOG_de-DE.md CHANGELOG_en-GB.md LICENSE.md LICENSE_de-DE.md LICENSE_en-GB.md; do
    if [ -f "$PLUGIN_DIR/$doc" ]; then
        if base64 -w 0 "$PLUGIN_DIR/$doc" > /dev/null 2>&1; then
            encoded="$(base64 -w 0 "$PLUGIN_DIR/$doc")"
        else
            # macOS kennt -w nicht
            encoded="$(base64 < "$PLUGIN_DIR/$doc" | tr -d '\n')"
        fi

        DOC_LINE="${DOC_LINE}'${doc}':'${encoded}',"
    fi
done

DOC_LINE="${DOC_LINE}};"

# Admin-Snippets aus snippet/<locale>.json ebenfalls base64-kodiert einbetten.
SNIPPET_DIR="$PLUGIN_DIR/src/Resources/app/administration/src/snippet"
SNIPPET_LINE="    var SNIPPET_DATA = {"

for snippet in "$SNIPPET_DIR"/*.json; do
    [ -f "$snippet" ] || continue
    locale="$(basename "$snippet" .json)"

    if command -v node > /dev/null 2>&1; then
        if ! node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" "$snippet" 2>/dev/null; then
            echo "Fehler: $snippet ist kein gueltiges JSON." >&2
            exit 1
        fi
    fi

    if base64 -w 0 "$snippet" > /dev/null 2>&1; then
        encoded="$(base64 -w 0 "$snippet")"
    else
        encoded="$(base64 < "$snippet" | tr -d '\n')"
    fi

    SNIPPET_LINE="${SNIPPET_LINE}'${locale}':'${encoded}',"
done

SNIPPET_LINE="${SNIPPET_LINE}};"

awk -v repl="$DOC_LINE" -v snippets="$SNIPPET_LINE" '
    index($0, "/* __DOC_DATA__ */") > 0 { print repl; next }
    index($0, "/* __SNIPPET_DATA__ */") > 0 { print snippets; next }
    { print }
' "$SOURCE" > "$TARGET"

if ! grep -q "var SNIPPET_DATA = {'" "$TARGET"; then
    echo "Fehler: Die Snippets wurden nicht in das Asset geschrieben." >&2
    echo "  Liegen snippet/de-DE.json und snippet/en-GB.json neben main.js?" >&2
    exit 1
fi

if ! grep -q "var DOC_DATA = {'" "$TARGET"; then
    echo "Fehler: Die Dokumente wurden nicht in das Asset geschrieben." >&2
    echo "  Steht der Platzhalter /* __DOC_DATA__ */ noch in main.js?" >&2
    exit 1
fi

# Dokumentation mit ausliefern, damit das Admin-Modul sie anzeigen kann.
DOC_DIR="$PLUGIN_DIR/src/Resources/public/administration/doc"
mkdir -p "$DOC_DIR"

for doc in README.md README_en-GB.md CHANGELOG_de-DE.md CHANGELOG_en-GB.md LICENSE.md LICENSE_de-DE.md LICENSE_en-GB.md; do
    if [ -f "$PLUGIN_DIR/$doc" ]; then
        cp "$PLUGIN_DIR/$doc" "$DOC_DIR/$doc"
    fi
done

echo "Kopiert nach: src/Resources/public/administration/assets/${FLAT}.js"
echo "Dokumentation nach: src/Resources/public/administration/doc/"
echo
echo "Auf dem Server danach:"
echo "  bin/console assets:install"
echo "  bin/console cache:clear"
