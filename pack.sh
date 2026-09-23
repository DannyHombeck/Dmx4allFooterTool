#!/usr/bin/env bash
#
# Baut ein installierbares ZIP. Der Dateiname enthaelt die Versionsnummer
# aus der composer.json, z. B. Dmx4allFooterTool-1.0.2.zip
#
set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_NAME="$(basename "$PLUGIN_DIR")"

VERSION="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$PLUGIN_DIR/composer.json" | head -n 1)"

if [ -z "$VERSION" ]; then
    echo "Fehler: Keine Version in composer.json gefunden." >&2
    exit 1
fi

BUILD_DIR="$PLUGIN_DIR/build"
STAGE_DIR="$BUILD_DIR/$PLUGIN_NAME"
ZIP_FILE="$BUILD_DIR/${PLUGIN_NAME}-${VERSION}.zip"
SOURCE_ZIP="$BUILD_DIR/${PLUGIN_NAME}-${VERSION}-source.zip"

# Das Admin-JS wird zur Laufzeit nur als fertiges Asset geladen.
if [ -d "$PLUGIN_DIR/src/Resources/app/administration/src" ] \
   && [ ! -f "$PLUGIN_DIR/src/Resources/public/administration/.vite/entrypoints.json" ]; then
    echo "WARNUNG: Unter src/Resources/public/administration fehlt das Asset."
    echo "  Vorher ./sync-admin.sh ausfuehren."
    echo
fi

rm -rf "$STAGE_DIR" "$ZIP_FILE"
mkdir -p "$STAGE_DIR"

cd "$PLUGIN_DIR"
tar \
    --exclude='./.git' \
    --exclude='./.github' \
    --exclude='./.idea' \
    --exclude='./build' \
    --exclude='./node_modules' \
    --exclude='./vendor' \
    --exclude='./tests' \
    --exclude='./rename.sh' \
    --exclude='./pack.sh' \
    --exclude='./bump.sh' \
    --exclude='./sync-admin.sh' \
    --exclude='./.gitignore' \
    --exclude='*.zip' \
    --exclude='.DS_Store' \
    -cf - . | (cd "$STAGE_DIR" && tar -xf -)

cd "$BUILD_DIR"
zip -rq "$(basename "$ZIP_FILE")" "$PLUGIN_NAME" -x '*.DS_Store'
rm -rf "$STAGE_DIR"

# Quell-ZIP: vollstaendiger Stand inklusive Entwicklerskripte.
# Das ist die Vorlage, mit der weitergearbeitet wird - das Plugin-ZIP
# oben enthaelt die Skripte bewusst nicht.
rm -f "$SOURCE_ZIP"
mkdir -p "$STAGE_DIR"
cd "$PLUGIN_DIR"
tar \
    --exclude='./.git' \
    --exclude='./build' \
    --exclude='./node_modules' \
    --exclude='./vendor' \
    --exclude='*.zip' \
    --exclude='.DS_Store' \
    -cf - . | (cd "$STAGE_DIR" && tar -xf -)
cd "$BUILD_DIR"
zip -rq "$(basename "$SOURCE_ZIP")" "$PLUGIN_NAME" -x '*.DS_Store'
rm -rf "$STAGE_DIR"

echo "Erstellt: $ZIP_FILE"
echo "Quellen:  $SOURCE_ZIP"
