/*
 * Dmx4allFooterTool - Administration
 *
 * Diese Datei wird bewusst NICHT gebaut. Shopware laedt sie ueber
 * ../../../public/administration/.vite/entrypoints.json direkt in die
 * Administration. Deshalb gilt:
 *
 *   - kein import / export, alles ueber das globale Shopware-Objekt
 *   - Templates als String-Array mit .join('\n')
 *   - Styling ueber ein injiziertes <style>-Element
 *
 * Nach jeder Aenderung diese Datei nach
 *   src/Resources/public/administration/assets/dmx4allfootertool.js
 * kopieren (sync-admin.sh macht genau das).
 */
(function () {
    'use strict';

    if (typeof Shopware === 'undefined') {
        return;
    }

    if (window.__dmx4allFooterToolLoaded) {
        return;
    }

    window.__dmx4allFooterToolLoaded = true;

    var Component = Shopware.Component;
    var Module = Shopware.Module;

    var ENTITY = 'dmx4all_footer_tool_layout';

    /*
     * Wird von bump.sh aktuell gehalten. Die Zeile bitte in dieser Form
     * stehen lassen, das Skript ersetzt sie per Muster.
     */
    var PLUGIN_VERSION = '1.16.2';

    var BUNDLE = 'dmx4allfootertool';

    var TECHNICAL_NAME = 'Dmx4allFooterTool';
    var CONFIG_DOMAIN = 'Dmx4allFooterTool.config';
    var LICENSE = 'MIT';

    /*
     * Dokumente fuer das Info-Modal. sync-admin.sh kopiert sie nach
     * src/Resources/public/administration/doc/.
     */
    var DOCUMENTS = {
        readme: { 'de-DE': 'README.md', 'en-GB': 'README_en-GB.md' },
        changelog: { 'de-DE': 'CHANGELOG_de-DE.md', 'en-GB': 'CHANGELOG_en-GB.md' },
        license: { 'de-DE': 'LICENSE_de-DE.md', 'en-GB': 'LICENSE_en-GB.md' }
    };

    /*
     * Die Dokumente liegen base64-kodiert direkt im ausgelieferten Asset.
     * sync-admin.sh ersetzt die folgende Zeile beim Kopieren durch die
     * echten Daten. Grund: Webserver liefern .md-Dateien aus public/
     * haeufig nicht aus, ein fetch() waere dann nicht verlaesslich.
     */
    var DOC_DATA = {}; /* __DOC_DATA__ */

    function decodeDoc(value) {
        var binary = window.atob(value);
        var bytes = new Uint8Array(binary.length);

        for (var i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }

        if (typeof TextDecoder !== 'undefined') {
            return new TextDecoder('utf-8').decode(bytes);
        }

        return decodeURIComponent(escape(binary));
    }

    /* Angaben fuer die Hersteller- und Support-Karte */
    var SUPPORT = {
        name: 'Dmx4all GmbH',
        website: 'https://www.dmx4all.de',
        websiteLabel: 'www.dmx4all.de',
        mail: 'support@dmx4all.de'
    };

    /*
     * Pfad zu den veroeffentlichten Assets. Der Praefix kann je nach
     * Installation abweichen, deshalb wird er aus dem Kontext gelesen.
     */
    function assetBase() {
        var needle = '/bundles/' + BUNDLE + '/administration/';

        /*
         * Zuverlaessigster Weg: den Pfad aus dem Script-Tag ableiten, mit
         * dem diese Datei selbst geladen wurde. Damit stimmt er auch bei
         * Installationen in einem Unterverzeichnis.
         */
        var scripts = document.querySelectorAll('script[src]');

        for (var i = 0; i < scripts.length; i += 1) {
            var src = scripts[i].getAttribute('src') || '';
            var at = src.indexOf(needle);

            if (at !== -1) {
                return src.substring(0, at + needle.length - 1);
            }
        }

        /* Rueckfall ueber den Kontext */
        var base = '';
        var api = Shopware.Context && Shopware.Context.api ? Shopware.Context.api : null;

        if (api) {
            base = api.assetsPath || api.assetPath || api.basePath || '';
        }

        if (base.length > 0 && base.charAt(base.length - 1) === '/') {
            base = base.substring(0, base.length - 1);
        }

        return base + '/bundles/' + BUNDLE + '/administration';
    }

    /*
     * Lesbare Fehlermeldung aus einer API-Antwort ziehen. Der Rueckfalltext
     * kommt aus den Snippets, damit er in beiden Sprachen stimmt.
     */
    function errorMessage(error) {
        if (typeof console !== 'undefined' && console.error) {
            console.error('[Dmx4allFooterTool]', error, error && error.response);
        }

        if (error && error.response && error.response.data) {
            var data = error.response.data;

            if (data.errors && data.errors.length) {
                return data.errors.map(function (item) {
                    return item.detail || item.title;
                }).join(', ');
            }
        }

        if (error && error.message) {
            return error.message;
        }

        if (Shopware.Snippet && typeof Shopware.Snippet.tc === 'function') {
            return Shopware.Snippet.tc('dmx4all-footer-tool.general.unknownError');
        }

        return 'unknown error';
    }

    /*
     * In die Zwischenablage schreiben. navigator.clipboard steht nur in
     * sicheren Kontexten zur Verfuegung, deshalb der Rueckfallweg.
     */
    function copyToClipboard(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(value);
        }

        return new Promise(function (resolve, reject) {
            var area = document.createElement('textarea');
            area.value = value;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.left = '-9999px';
            document.body.appendChild(area);
            area.select();

            try {
                document.execCommand('copy');
                resolve();
            } catch (error) {
                reject(error);
            } finally {
                document.body.removeChild(area);
            }
        });
    }

    /*
     * Sehr kleiner Markdown-Renderer. Er deckt nur ab, was in unseren
     * Dokumenten vorkommt: Ueberschriften, Listen, Tabellen, Code,
     * Links sowie fett und kursiv. Der Text wird vorher maskiert,
     * damit aus dem Dokument kein HTML in die Seite gelangt.
     */
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderInline(text) {
        return text
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    function renderMarkdown(source) {
        var lines = escapeHtml(source).split('\n');
        var html = [];
        var list = false;
        var code = false;
        var table = false;
        var para = [];

        /* Aufeinanderfolgende Textzeilen bilden einen Absatz */
        function flushPara() {
            if (para.length) {
                html.push('<p>' + renderInline(para.join(' ')) + '</p>');
                para = [];
            }
        }

        function closeList() {
            if (list) {
                html.push('</ul>');
                list = false;
            }
        }

        function closeTable() {
            if (table) {
                html.push('</table>');
                table = false;
            }
        }

        for (var i = 0; i < lines.length; i += 1) {
            var line = lines[i];

            if (line.indexOf('```') === 0) {
                flushPara();
                closeList();
                closeTable();

                if (code) {
                    html.push('</code></pre>');
                    code = false;
                } else {
                    html.push('<pre><code>');
                    code = true;
                }

                continue;
            }

            if (code) {
                html.push(line);
                continue;
            }

            var heading = line.match(/^(#{1,4})\s+(.*)$/);

            if (heading) {
                flushPara();
                closeList();
                closeTable();
                var level = heading[1].length + 1;
                html.push('<h' + level + '>' + renderInline(heading[2]) + '</h' + level + '>');
                continue;
            }

            /* Trennzeile einer Tabelle ueberspringen */
            if (/^\|[\s:|-]+\|$/.test(line)) {
                continue;
            }

            if (line.indexOf('|') === 0) {
                flushPara();
                closeList();

                if (!table) {
                    html.push('<table class="dmx4all-doc__table">');
                    table = true;
                }

                var cells = line.split('|').slice(1, -1).map(function (cell) {
                    return '<td>' + renderInline(cell.trim()) + '</td>';
                });

                html.push('<tr>' + cells.join('') + '</tr>');
                continue;
            }

            closeTable();

            var item = line.match(/^\s*[-*]\s+(.*)$/);

            if (item) {
                flushPara();

                if (!list) {
                    html.push('<ul>');
                    list = true;
                }

                html.push('<li>' + renderInline(item[1]) + '</li>');
                continue;
            }

            /* Eingerueckte Folgezeile eines Listenpunkts: an den Punkt anhaengen */
            if (list && /^\s+\S/.test(line) && html.length && html[html.length - 1].slice(-5) === '</li>') {
                html[html.length - 1] = html[html.length - 1].slice(0, -5) + ' ' + renderInline(line.trim()) + '</li>';
                continue;
            }

            closeList();

            if (line.trim() === '') {
                flushPara();
                continue;
            }

            para.push(line.trim());
        }

        flushPara();
        closeList();
        closeTable();

        if (code) {
            html.push('</code></pre>');
        }

        return html.join('\n');
    }

    /* ------------------------------------------------------------------ */
    /* Snippets                                                            */
    /*                                                                     */
    /* Quelle sind snippet/de-DE.json und snippet/en-GB.json neben dieser  */
    /* Datei. sync-admin.sh bettet sie base64-kodiert in die folgende      */
    /* Zeile ein, weil das ungebaute Admin-JS keine JSON-Imports kennt.    */
    /* ------------------------------------------------------------------ */

    var SNIPPET_DATA = {}; /* __SNIPPET_DATA__ */

    var snippets = {};

    Object.keys(SNIPPET_DATA).forEach(function (locale) {
        try {
            snippets[locale] = JSON.parse(decodeDoc(SNIPPET_DATA[locale]));
        } catch (error) {
            if (window.console && window.console.error) {
                window.console.error('[Dmx4allFooterTool] snippets ' + locale, error);
            }
        }
    });


    /* ------------------------------------------------------------------ */
    /* Footer-Builder                                                      */
    /*                                                                     */
    /* Beliebig viele Bereiche, in die per Drag and Drop Text- und Bild-   */
    /* Elemente gezogen werden. Bereiche lassen sich hinzufuegen,          */
    /* entfernen und verschieben.                                          */
    /* gezogen werden. Drag and Drop laeuft ueber die native HTML5-API,    */
    /* damit keine zusaetzliche Bibliothek geladen werden muss.            */
    /* ------------------------------------------------------------------ */

    /* Anzahl der Bereiche ist frei; neue Layouts starten mit DEFAULT_AREAS */
    var DEFAULT_AREAS = 4;
    var MAX_AREAS = 24;
    var MAX_COLUMNS = 12;

    /*
     * Automatisches Speichern: Verzoegerung in Sekunden, 0 = aus.
     * Wird je Browser gemerkt (localStorage), Standard 5 Sekunden.
     */
    var AUTOSAVE_KEY = 'dmx4all-footer-tool.autosaveDelay';
    var AUTOSAVE_DEFAULT = 5;
    var AUTOSAVE_CHOICES = [0, 3, 5, 10, 30, 60];

    function readAutosaveDelay() {
        try {
            var stored = window.localStorage.getItem(AUTOSAVE_KEY);

            if (stored !== null && AUTOSAVE_CHOICES.indexOf(parseInt(stored, 10)) !== -1) {
                return parseInt(stored, 10);
            }
        } catch (error) {
            /* localStorage nicht verfuegbar */
        }

        return AUTOSAVE_DEFAULT;
    }

    function writeAutosaveDelay(value) {
        try {
            window.localStorage.setItem(AUTOSAVE_KEY, String(value));
        } catch (error) {
            /* ignorieren */
        }
    }

    function pad2(number) {
        return number < 10 ? '0' + number : String(number);
    }

    /* Laufender Zieh-Vorgang (bewusst ausserhalb von Vue, siehe onPointerDown) */
    var POINTER = null;

    /* Einstellungen der Anordnung, gespeichert in der Plugin-Konfiguration */
    var CONFIG_DEFAULTS = {
        active: true,
        placement: 'inline',
        showHotline: true,
        showNavigation: true,
        columnsDesktop: 4,
        columnsTablet: 2,
        columnsMobile: 1,
        hideEmptyAreas: false
    };

    var CONFIG_KEYS = Object.keys(CONFIG_DEFAULTS);

    function configKey(key) {
        return CONFIG_DOMAIN + '.' + key;
    }

    /* Werte aus der API (volle Schluessel) auf kurze Schluessel abbilden */
    function pickConfig(values) {
        var result = {};

        CONFIG_KEYS.forEach(function (key) {
            var value = values ? values[configKey(key)] : undefined;

            if (value !== undefined && value !== null && value !== '') {
                result[key] = value;
            }
        });

        return result;
    }

    function clampColumns(value, fallback) {
        var number = parseInt(value, 10);

        if (!(number >= 1)) {
            return fallback;
        }

        return Math.min(number, MAX_COLUMNS);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function createId() {
        if (Shopware.Utils && typeof Shopware.Utils.createId === 'function') {
            return Shopware.Utils.createId();
        }

        return String(Date.now()) + String(Math.random()).substring(2);
    }

    /* span: Anzahl Spalten (1-12) oder 'full' fuer die ganze Breite */
    function newArea() {
        return { id: createId(), span: 1, design: {}, items: [] };
    }

    /*
     * Standard-Spalten von Shopware als Eintraege im Layout:
     *   { id, type: 'core', key: 'hotline' | 'nav-1' | 'nav-2' ... | 'nav', span, hidden }
     * 'nav' steht fuer alle Navigationsspalten ohne eigenen Eintrag.
     */
    function newCore(key) {
        /* items bleibt leer; so koennen Schleifen ueber alle Eintraege items lesen */
        var entry = { id: createId(), type: 'core', key: key, span: 1, hidden: false, mode: 'default', headline: {}, design: {}, items: [] };

        /* Logos und Fussleiste stehen standardmaessig an ihrem Originalplatz unter der Zeile */
        if (isOutsideKey(key)) {
            entry.inRow = false;
            entry.span = 'full';
        }

        return entry;
    }

    /* Teile des Footers, die bei Shopware unterhalb der Spaltenzeile stehen */
    var OUTSIDE_KEYS = ['payment', 'shipping', 'servicemenu', 'vat', 'copyright'];

    /*
     * Geltungsbereich eines Layouts: Listen von Verkaufskanal- bzw.
     * Sprach-IDs, leer = alle. Layouts bis 1.13 hatten je eine einzelne ID.
     */
    function entryChannels(entry) {
        if (entry && Array.isArray(entry.salesChannelIds) && entry.salesChannelIds.length) {
            return entry.salesChannelIds.slice();
        }

        return entry && entry.salesChannelId ? [entry.salesChannelId] : [];
    }

    function entryLanguages(entry) {
        if (entry && Array.isArray(entry.languageIds) && entry.languageIds.length) {
            return entry.languageIds.slice();
        }

        return entry && entry.languageId ? [entry.languageId] : [];
    }

    /* Zwei Listen ueberschneiden sich (leer = alle) */
    function scopeOverlaps(a, b) {
        if (!a.length || !b.length) {
            return true;
        }

        return a.some(function (id) { return b.indexOf(id) !== -1; });
    }

    /*
     * Design je Bereich / Standard-Spalte. Leere Werte = wie vom Theme.
     * type: color | px | number | select
     */
    var DESIGN_FIELDS = [
        { group: 'box', key: 'backgroundColor', type: 'color' },
        { group: 'box', key: 'padding', type: 'px', min: 0, max: 80 },
        { group: 'box', key: 'borderWidth', type: 'px', min: 0, max: 20 },
        { group: 'box', key: 'borderStyle', type: 'select', options: ['solid', 'dashed', 'dotted', 'double'] },
        { group: 'box', key: 'borderColor', type: 'color' },
        { group: 'box', key: 'borderRadius', type: 'px', min: 0, max: 60 },
        { group: 'text', key: 'textColor', type: 'color' },
        { group: 'text', key: 'fontSize', type: 'px', min: 8, max: 40 },
        { group: 'text', key: 'fontWeight', type: 'select', options: ['300', '400', '500', '600', '700', '800'] },
        { group: 'text', key: 'lineHeight', type: 'number', min: 0.8, max: 3, step: 0.1 },
        { group: 'text', key: 'textAlign', type: 'select', options: ['left', 'center', 'right', 'justify'] },
        { group: 'text', key: 'headingColor', type: 'color' },
        { group: 'link', key: 'linkColor', type: 'color' },
        { group: 'link', key: 'linkHoverColor', type: 'color' },
        { group: 'link', key: 'linkDecoration', type: 'select', options: ['none', 'underline'] },
        { group: 'link', key: 'linkHoverDecoration', type: 'select', options: ['none', 'underline'] }
    ];

    var COLOR_PATTERN = /^(#[0-9a-fA-F]{3,4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)|transparent)$/;

    /* Nur gueltige, gesetzte Werte behalten */
    function normalizeDesign(raw) {
        var result = {};

        if (!raw || typeof raw !== 'object') {
            return result;
        }

        DESIGN_FIELDS.forEach(function (field) {
            var value = raw[field.key];

            if (value === undefined || value === null || value === '') {
                return;
            }

            if (field.type === 'color') {
                value = String(value).trim();

                if (COLOR_PATTERN.test(value)) {
                    result[field.key] = value;
                }

                return;
            }

            if (field.type === 'px' || field.type === 'number') {
                var number = parseFloat(String(value).replace(',', '.'));

                if (!isNaN(number)) {
                    number = Math.min(Math.max(number, field.min), field.max);
                    result[field.key] = field.type === 'px' ? Math.round(number) : Math.round(number * 10) / 10;
                }

                return;
            }

            if (field.options.indexOf(String(value)) !== -1) {
                result[field.key] = String(value);
            }
        });

        return result;
    }

    /* CSS-Werte fuer Vorschau und Kachel (Admin) */
    function designBoxStyle(design) {
        var d = design || {};
        var style = {};

        if (d.backgroundColor) { style.backgroundColor = d.backgroundColor; }
        if (d.textColor) { style.color = d.textColor; }
        if (d.fontSize) { style.fontSize = d.fontSize + 'px'; }
        if (d.fontWeight) { style.fontWeight = d.fontWeight; }
        if (d.lineHeight) { style.lineHeight = String(d.lineHeight); }
        if (d.textAlign) { style.textAlign = d.textAlign; }
        if (d.padding !== undefined) { style.padding = d.padding + 'px'; }
        if (d.borderWidth !== undefined) {
            style.border = d.borderWidth + 'px ' + (d.borderStyle || 'solid') + ' ' + (d.borderColor || 'currentColor');
        }
        if (d.borderRadius !== undefined) { style.borderRadius = d.borderRadius + 'px'; }

        return style;
    }

    /* Sammel-Eintraege bis 1.9.x und ihre Einzelteile */
    var LEGACY_PARTS = {
        logos: ['payment', 'shipping'],
        bottom: ['servicemenu', 'vat', 'copyright']
    };

    function isOutsideKey(key) {
        return OUTSIDE_KEYS.indexOf(key) !== -1 || key === 'logos' || key === 'bottom';
    }

    function isCore(entry) {
        return !!entry && entry.type === 'core';
    }

    function normalizeSpan(span) {
        if (span === 'full') {
            return 'full';
        }

        var number = parseInt(span, 10);

        return number >= 1 ? Math.min(number, MAX_COLUMNS) : 1;
    }

    function emptyLayout() {
        var areas = [];

        for (var i = 0; i < DEFAULT_AREAS; i += 1) {
            areas.push(newArea());
        }

        return { areas: areas };
    }

    /* Gespeichertes JSON pruefen: so viele Bereiche wie gespeichert, nur gueltige Elemente */
    function normalizeLayout(raw) {
        var source = raw && Array.isArray(raw.areas) ? raw.areas.slice(0, MAX_AREAS + 30) : null;

        if (!source || !source.length) {
            return emptyLayout();
        }

        var layout = { areas: [] };

        for (var i = 0; i < source.length; i += 1) {
            if (isCore(source[i]) && source[i].key) {
                var core = newCore(String(source[i].key));
                core.id = source[i].id || core.id;
                core.span = normalizeSpan(source[i].span);
                core.hidden = !!source[i].hidden;
                core.mode = ['append', 'replace'].indexOf(source[i].mode) !== -1 ? source[i].mode : 'default';
                core.headline = toTranslated(source[i].headline);
                core.items = normalizeItems(source[i].items);
                core.design = normalizeDesign(source[i].design);

                if (isOutsideKey(core.key)) {
                    core.inRow = !!source[i].inRow;
                }

                layout.areas.push(core);

                continue;
            }

            var items = source[i] && Array.isArray(source[i].items) ? source[i].items : [];

            layout.areas.push(newArea());
            var target = layout.areas[layout.areas.length - 1];
            target.id = (source[i] && source[i].id) || target.id;
            target.span = normalizeSpan(source[i] ? source[i].span : 1);
            target.design = normalizeDesign(source[i] ? source[i].design : null);
            target.items = normalizeItems(items);
        }

        return layout;
    }

    /* Text- und Bild-Elemente eines Bereichs bzw. einer Standard-Spalte pruefen */
    function normalizeItems(items) {
        return (Array.isArray(items) ? items : []).filter(function (item) {
            return item && (item.type === 'text' || item.type === 'image');
        }).map(function (item) {
            var copy = clone(item);
            copy.id = copy.id || createId();

            if (copy.type === 'text') {
                copy.content = toTranslated(copy.content);
            } else {
                copy.alt = toTranslated(copy.alt);
                copy.link = toTranslated(copy.link);

                /* Bis 1.10.x gab es nur "maximale Breite" */
                if (!copy.width && copy.maxWidth) {
                    copy.width = copy.maxWidth;
                    copy.widthUnit = 'px';
                }

                delete copy.maxWidth;
                copy.widthUnit = copy.widthUnit === '%' ? '%' : 'px';
            }

            return copy;
        });
    }

    /*
     * Uebersetzbare Felder (Text, Alt-Text, Link) werden als Objekt
     * { languageId: wert } gespeichert. Alte Layouts mit einfachem String
     * werden der Systemsprache zugeordnet.
     */
    function systemLanguageId() {
        var api = Shopware.Context && Shopware.Context.api ? Shopware.Context.api : {};

        return api.systemLanguageId || '2fbb5fe2e29a4d70aa5854ce7ce3e20b';
    }

    function toTranslated(value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return Object.assign({}, value);
        }

        var result = {};

        if (typeof value === 'string' && value !== '') {
            result[systemLanguageId()] = value;
        }

        return result;
    }

    function cleanTranslated(map, isHtml) {
        var result = {};

        Object.keys(map || {}).forEach(function (languageId) {
            var value = String(map[languageId] || '').trim();
            var hasContent = isHtml ? (plainText(value) !== '' || /<img/i.test(value)) : value !== '';

            if (hasContent) {
                result[languageId] = value;
            }
        });

        return result;
    }

    function newItem(type) {
        if (type === 'image') {
            return {
                id: createId(),
                type: 'image',
                mediaId: null,
                alt: {},
                link: {},
                newTab: false,
                width: null,
                widthUnit: 'px',
                height: null,
                align: 'left'
            };
        }

        return { id: createId(), type: 'text', content: {} };
    }

    /* Text ohne HTML fuer die Vorschau. DOMParser fuehrt nichts aus. */
    function plainText(html) {
        if (!html) {
            return '';
        }

        try {
            var doc = new DOMParser().parseFromString(String(html), 'text/html');

            return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
        } catch (error) {
            return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
    }

    /* ------------------------------------------------------------------ */
    /* Hilfe / Dokumentation als Mixin (Editor und Einstellungen)          */
    /* ------------------------------------------------------------------ */

    var DOC_MODAL_TEMPLATE = [
        '        <sw-modal v-if="showDocs"',
        '                  class="dmx4all-doc-modal"',
        '                  variant="large"',
        '                  :title="$tc(\'dmx4all-footer-tool.doc.title\')"',
        '                  @modal-close="onCloseDocs">',
        '',
        '            <div class="dmx4all-doc__bar">',
        '                <div class="dmx4all-doc__tabs">',
        '                    <button v-for="tab in docTabs"',
        '                            :key="tab.key"',
        '                            type="button"',
        '                            class="dmx4all-doc__tab"',
        '                            :class="{ \'is--active\': tab.key === activeDoc }"',
        '                            @click="onSelectDoc(tab.key)">{{ tab.label }}</button>',
        '                </div>',
        '                <div class="dmx4all-doc__langs">',
        '                    <button v-for="lang in docLanguages"',
        '                            :key="lang.key"',
        '                            type="button"',
        '                            class="dmx4all-doc__lang"',
        '                            :class="{ \'is--active\': lang.key === docLanguage }"',
        '                            @click="onSelectLanguage(lang.key)">{{ lang.label }}</button>',
        '                </div>',
        '            </div>',
        '',
        '            <div class="dmx4all-doc__body">',
        '                <p v-if="docLoading">{{ $tc(\'dmx4all-footer-tool.doc.loading\') }}</p>',
        '                <div v-else-if="docError" class="dmx4all-doc__error">',
        '                    <p>{{ $tc(\'dmx4all-footer-tool.doc.error\') }}</p>',
        '                    <p><code>{{ docUrl }}</code></p>',
        '                    <p v-if="docStatus"><code>{{ docStatus }}</code></p>',
        '                    <p>{{ $tc(\'dmx4all-footer-tool.doc.errorHint\') }}</p>',
        '                </div>',
        '                <div v-else class="dmx4all-doc__content" v-html="docHtml"></div>',
        '            </div>',
        '',
        '            <template #modal-footer>',
        '                <mt-button variant="secondary" size="small" @click="onCloseDocs">',
        '                    {{ $tc(\'dmx4all-footer-tool.doc.close\') }}',
        '                </mt-button>',
        '            </template>',
        '        </sw-modal>',
    ].join('\n');

    var DOC_MIXIN = {
        data: function () {
            return {
                showDocs: false,
                activeDoc: 'readme',
                docLanguage: 'de-DE',
                docHtml: '',
                docLoading: false,
                docError: false,
                docUrl: '',
                docStatus: ''
            };
        },

        computed: {
        docTabs: function () {
            return [
                { key: 'readme', label: this.$tc('dmx4all-footer-tool.doc.readme') },
                { key: 'changelog', label: this.$tc('dmx4all-footer-tool.doc.changelog') },
                { key: 'license', label: this.$tc('dmx4all-footer-tool.doc.license') }
            ];
        },

        docLanguages: function () {
            return [
                { key: 'de-DE', label: this.$tc('dmx4all-footer-tool.doc.languageDe') },
                { key: 'en-GB', label: this.$tc('dmx4all-footer-tool.doc.languageEn') }
            ];
        }
        },

        methods: {
        onOpenDocs: function () {
            /* Sprache der Oberflaeche als Vorauswahl uebernehmen */
            var locale = Shopware.Context && Shopware.Context.app
                ? Shopware.Context.app.adminLocale
                : null;

            this.docLanguage = (locale && locale.indexOf('de') === 0) ? 'de-DE' : 'en-GB';
            this.showDocs = true;

            return this.loadDoc();
        },

        onCloseDocs: function () {
            this.showDocs = false;
        },

        onSelectDoc: function (key) {
            this.activeDoc = key;

            return this.loadDoc();
        },

        onSelectLanguage: function (key) {
            this.docLanguage = key;

            return this.loadDoc();
        },

        loadDoc: function () {
            var that = this;
            var files = DOCUMENTS[this.activeDoc];

            if (!files) {
                return Promise.resolve();
            }

            var file = files[this.docLanguage] || files['de-DE'];

            this.docLoading = true;
            this.docError = false;
            this.docHtml = '';

            var url = assetBase() + '/doc/' + file;

            this.docUrl = url;
            this.docStatus = '';

            /* Eingebettete Fassung bevorzugen */
            if (DOC_DATA[file]) {
                try {
                    this.docHtml = renderMarkdown(decodeDoc(DOC_DATA[file]));
                    this.docLoading = false;

                    return Promise.resolve();
                } catch (error) {
                    if (window.console && window.console.error) {
                        window.console.error('[Dmx4allFooterTool] doc decode', error);
                    }
                }
            }

            return fetch(url, { cache: 'no-cache' })
                .then(function (response) {
                    that.docStatus = 'HTTP ' + response.status;

                    if (!response.ok) {
                        throw new Error(that.docStatus);
                    }

                    return response.text();
                })
                .then(function (text) {
                    /*
                     * Liefert der Server statt der Datei die index.php
                     * aus (haeufig bei fehlendem assets:install), kommt
                     * HTML zurueck. Das wuerde als leere Seite enden,
                     * deshalb wird es hier erkannt.
                     */
                    if (/^\s*<(!doctype|html)/i.test(text)) {
                        that.docStatus = that.$tc('dmx4all-footer-tool.doc.statusHtml');
                        throw new Error(that.docStatus);
                    }

                    var html = renderMarkdown(text);

                    if (html.replace(/\s/g, '') === '') {
                        /* Nichts erkannt: dann wenigstens den Rohtext */
                        that.docHtml = '<pre>' + escapeHtml(text) + '</pre>';
                        return;
                    }

                    that.docHtml = html;
                })
                .catch(function (error) {
                    that.docError = true;

                    if (window.console && window.console.error) {
                        window.console.error('[Dmx4allFooterTool] doc', url, error);
                    }
                })
                .finally(function () {
                    that.docLoading = false;
                });
        }
        }
    };

    Component.register('dmx4all-footer-tool-builder', {
        template: [
            '<sw-page class="dmx4all-footer-tool-builder" :class="{ \'is--readonly\': !canEdit }">',
            '    <template #smart-bar-header>',
            '        <div class="dmx4all-page-title">',
            '            <h2>{{ $tc(\'dmx4all-footer-tool.general.mainMenuItemGeneral\') }}</h2>',
            '            <div class="dft-title-meta">',
            '                <button type="button"',
            '                        class="dft-help-button"',
            '                        :title="$tc(\'dmx4all-footer-tool.general.help\')"',
            '                        :aria-label="$tc(\'dmx4all-footer-tool.general.help\')"',
            '                        @click="onOpenDocs">?</button>',
            '                <span class="dmx4all-version-badge">',
            '                    {{ $tc(\'dmx4all-footer-tool.support.version\') }} {{ pluginVersion }}',
            '                </span>',
            '                <span class="dft-save-status" :class="\'is--\' + saveStatus.kind" role="status" aria-live="polite">',
            '                    <span class="dft-save-status__dot" aria-hidden="true"></span>',
            '                    <span>{{ saveStatus.text }}</span>',
            '                </span>',
            '            </div>',
            '        </div>',
            '    </template>',
            '',
            '    <template #smart-bar-actions>',
            '        <label v-if="canEdit" class="dft-autosave" :title="$tc(\'dmx4all-footer-tool.autosave.help\')">',
            '            <span>{{ $tc(\'dmx4all-footer-tool.autosave.label\') }}</span>',
            '            <select class="dft-autosave__select" :value="String(autosaveDelay)" @change="onAutosaveChange($event.target.value)">',
            '                <option v-for="option in autosaveOptions" :key="option.value" :value="option.value">{{ option.label }}</option>',
            '            </select>',
            '        </label>',
            '        <mt-button variant="secondary" size="default" @click="onSettings">',
            '            {{ $tc(\'dmx4all-footer-tool.general.settings\') }}',
            '        </mt-button>',
            '        <mt-button v-if="canEdit" variant="primary" size="default" :is-loading="isSaving" :disabled="isLoading" @click="onSave">',
            '            {{ $tc(\'dmx4all-footer-tool.builder.buttonSave\') }}',
            '        </mt-button>',
            '    </template>',
            '',
            '    <template #content>',
            '        <sw-card-view>',
            '            <div v-if="!canEdit" class="dft-readonly-note" role="status">{{ $tc(\'dmx4all-footer-tool.acl.readonly\') }}</div>',
            '',
            '            <mt-card :title="$tc(\'dmx4all-footer-tool.layouts.title\')" :is-loading="isLoading">',
            '                <p class="dft-muted">{{ $tc(\'dmx4all-footer-tool.layouts.text\') }}</p>',
            '',
            '                <div class="dft-layouts">',
            '                    <div class="dft-layouts__list">',
            '                        <button v-for="entry in sortedRecords"',
            '                                :key="entry.id"',
            '                                type="button"',
            '                                class="dft-layout-row"',
            '                                :class="{ \'is--current\': entry.id === currentId }"',
            '                                @click="onSelectLayout(entry)">',
            '                            <span class="dft-layout-row__name">{{ entry.name || $tc(\'dmx4all-footer-tool.layouts.unnamed\') }}</span>',
            '                            <span class="dft-layout-row__scope">',
            '                                <span v-if="scopeProblem(entryChannels(entry), entryLanguages(entry))" class="dft-scope-warning" :title="$tc(\'dmx4all-footer-tool.layouts.deletedHint\')">&#9888;</span>',
            '                                {{ entryScopeLabel(entry) }}',
            '                            </span>',
            '                            <span class="dft-layout-row__badge" :class="entry.active ? \'is--active\' : \'is--inactive\'">',
            '                                {{ entry.active ? $tc(\'dmx4all-footer-tool.layouts.active\') : $tc(\'dmx4all-footer-tool.layouts.inactive\') }}',
            '                            </span>',
            '                        </button>',
            '                        <div v-if="!currentId" class="dft-layout-row is--current is--new">',
            '                            <span class="dft-layout-row__name">{{ layoutName || $tc(\'dmx4all-footer-tool.layouts.unnamed\') }}</span>',
            '                            <span class="dft-layout-row__scope">{{ scopeLabel(channelIds, languageIds) }}</span>',
            '                            <span class="dft-layout-row__badge is--new">{{ $tc(\'dmx4all-footer-tool.layouts.new\') }}</span>',
            '                        </div>',
            '',
            '                        <div class="dft-layouts__actions">',
            '                            <button v-if="canCreate" type="button" class="dft-link" @click="onNewLayout">+ {{ $tc(\'dmx4all-footer-tool.layouts.create\') }}</button>',
            '                            <button v-if="canCreate" type="button" class="dft-link" :disabled="!currentId" @click="onDuplicateLayout">{{ $tc(\'dmx4all-footer-tool.layouts.duplicate\') }}</button>',
            '                            <button v-if="canDelete" type="button" class="dft-link is--danger" :disabled="!currentId || isLoading || isSaving" @click="onDelete">{{ $tc(\'dmx4all-footer-tool.layouts.delete\') }}</button>',
            '                        </div>',
            '                        <div class="dft-layouts__actions">',
            '                            <button type="button" class="dft-link" :disabled="isTransferring" @click="onExportClick">{{ $tc(\'dmx4all-footer-tool.transfer.exportCurrent\') }}</button>',
            '                            <button v-if="canCreate" type="button" class="dft-link" :disabled="isTransferring" @click="onImportClick">{{ $tc(\'dmx4all-footer-tool.transfer.import\') }}</button>',
            '                            <input ref="importFile" class="dft-hidden-file" type="file" accept=".json,application/json" @change="onImportFile">',
            '                        </div>',
            '                    </div>',
            '',
            '                    <div class="dft-layouts__detail">',
            '                        <label class="dft-field">',
            '                            <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.layouts.name\') }}</span>',
            '                            <input class="dft-select" type="text" :value="layoutName" @input="onLayoutNameInput($event.target.value)">',
            '                        </label>',
            '',
            '                        <div class="dft-field">',
            '                            <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.layouts.status\') }}</span>',
            '                            <div class="dft-segment">',
            '                                <button type="button" :class="{ \'is--active\': layoutActive }" @click="onLayoutActive(true)">{{ $tc(\'dmx4all-footer-tool.layouts.active\') }}</button>',
            '                                <button type="button" :class="{ \'is--active\': !layoutActive }" @click="onLayoutActive(false)">{{ $tc(\'dmx4all-footer-tool.layouts.inactive\') }}</button>',
            '                            </div>',
            '                        </div>',
            '',
            '                        <div class="dft-field dft-field--wide">',
            '                            <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.layouts.channels\') }}</span>',
            '                            <div class="dft-multi">',
            '                                <button type="button" class="dft-chip" :class="{ \'is--active\': !channelIds.length }" @click="onScopeAll(\'channel\')">{{ $tc(\'dmx4all-footer-tool.builder.all\') }}</button>',
            '                                <button v-for="channel in salesChannels"',
            '                                        :key="channel.id"',
            '                                        type="button"',
            '                                        class="dft-chip"',
            '                                        :class="{ \'is--active\': channelIds.indexOf(channel.id) !== -1 }"',
            '                                        @click="onScopeToggle(\'channel\', channel.id)">{{ channelName(channel.id) }}</button>',
            '                                <button v-for="id in unknownIds(channelIds, \'channel\')"',
            '                                        :key="\'deleted-\' + id"',
            '                                        type="button"',
            '                                        class="dft-chip is--active is--deleted"',
            '                                        :title="$tc(\'dmx4all-footer-tool.layouts.removeDeleted\')"',
            '                                        @click="onScopeToggle(\'channel\', id)">{{ $tc(\'dmx4all-footer-tool.layouts.deletedChannel\') }} &times;</button>',
            '                            </div>',
            '                        </div>',
            '                        <div class="dft-field dft-field--wide">',
            '                            <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.layouts.languages\') }}</span>',
            '                            <div class="dft-multi">',
            '                                <button type="button" class="dft-chip" :class="{ \'is--active\': !languageIds.length }" @click="onScopeAll(\'language\')">{{ $tc(\'dmx4all-footer-tool.builder.all\') }}</button>',
            '                                <button v-for="language in languages"',
            '                                        :key="language.id"',
            '                                        type="button"',
            '                                        class="dft-chip"',
            '                                        :class="{ \'is--active\': languageIds.indexOf(language.id) !== -1 }"',
            '                                        @click="onScopeToggle(\'language\', language.id)">{{ languageName(language.id) }}</button>',
            '                                <button v-for="id in unknownIds(languageIds, \'language\')"',
            '                                        :key="\'deleted-\' + id"',
            '                                        type="button"',
            '                                        class="dft-chip is--active is--deleted"',
            '                                        :title="$tc(\'dmx4all-footer-tool.layouts.removeDeleted\')"',
            '                                        @click="onScopeToggle(\'language\', id)">{{ $tc(\'dmx4all-footer-tool.layouts.deletedLanguage\') }} &times;</button>',
            '                            </div>',
            '                            <p class="dft-muted">{{ $tc(\'dmx4all-footer-tool.layouts.scopeHint\') }}</p>',
            '                        </div>',
            '',
            '                        <div v-if="scopeProblem(channelIds, languageIds)" class="dft-status dft-status--warning">',
            '                            {{ scopeProblem(channelIds, languageIds) === \'nowhere\' ? $tc(\'dmx4all-footer-tool.layouts.deletedNowhere\') : $tc(\'dmx4all-footer-tool.layouts.deletedSome\') }}',
            '                            <button type="button" class="dft-link" @click="onRemoveDeletedScope">{{ $tc(\'dmx4all-footer-tool.layouts.removeDeleted\') }}</button>',
            '                        </div>',
            '                        <div class="dft-status" :class="{ \'is--own\': layoutStatus.kind === \'live\' }">',
            '                            {{ layoutStatus.text }}',
            '                        </div>',
            '                    </div>',
            '                </div>',
            '            </mt-card>',
            '',
            '            <mt-card :title="$tc(\'dmx4all-footer-tool.arrangement.title\')" :is-loading="isLoading || isConfigLoading">',
            '                <p class="dft-muted">{{ $tc(\'dmx4all-footer-tool.arrangement.text\') }}</p>',
            '',
            '                <div v-if="channelIds.length > 1" class="dft-status">{{ $tc(\'dmx4all-footer-tool.layouts.multiChannelConfig\') }}</div>',
            '                <div v-if="salesChannelId" class="dft-status" :class="{ \'is--own\': hasOwnConfig }">',
            '                    <template v-if="hasOwnConfig">{{ $tc(\'dmx4all-footer-tool.arrangement.ownValues\') }}</template>',
            '                    <template v-else>{{ $tc(\'dmx4all-footer-tool.arrangement.inherited\') }}</template>',
            '                    <button v-if="hasOwnConfig" type="button" class="dft-link" @click="onResetConfig">',
            '                        {{ $tc(\'dmx4all-footer-tool.arrangement.resetInheritance\') }}',
            '                    </button>',
            '                </div>',
            '',
            '                <div class="dft-arrangement">',
            '                    <div class="dft-arrangement__fields">',
            '                        <mt-switch v-model="config.active"',
            '                                   :label="$tc(\'dmx4all-footer-tool.arrangement.active\')" />',
            '',
            '                        <label class="dft-field">',
            '                            <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.arrangement.placement\') }}</span>',
            '                            <select class="dft-select" :value="config.placement" @change="setConfig(\'placement\', $event.target.value)">',
            '                                <option v-for="option in placementOptions" :key="option.value" :value="option.value">{{ option.label }}</option>',
            '                            </select>',
            '                        </label>',
            '',
            '                        <p v-if="config.placement === \'inline\'" class="dft-muted dft-inline-hint">{{ $tc(\'dmx4all-footer-tool.core.arrangementHint\') }}</p>',
            '',
            '                        <div class="dft-columns">',
            '                            <label v-for="field in columnFields" :key="field.key" class="dft-field dft-field--small">',
            '                                <span class="dft-field__label">{{ field.label }}</span>',
            '                                <input class="dft-select" type="number" min="1" :max="maxColumns"',
            '                                       :value="config[field.key]"',
            '                                       @change="setConfig(field.key, $event.target.value)">',
            '                            </label>',
            '                        </div>',
            '',
            '                        <template v-if="config.placement === \'before\' || config.placement === \'after\'">',
            '                            <mt-switch v-model="config.showHotline"',
            '                                       :label="$tc(\'dmx4all-footer-tool.arrangement.showHotline\')" />',
            '                            <mt-switch v-model="config.showNavigation"',
            '                                       :label="$tc(\'dmx4all-footer-tool.arrangement.showNavigation\')" />',
            '                        </template>',
            '',
            '                        <mt-switch v-if="config.placement !== \'inline\'"',
            '                                   v-model="config.hideEmptyAreas"',
            '                                   :label="$tc(\'dmx4all-footer-tool.arrangement.hideEmptyAreas\')" />',
            '                        <p v-else class="dft-muted">{{ $tc(\'dmx4all-footer-tool.arrangement.hideEmptyHint\') }}</p>',
            '                    </div>',
            '',
            '                    <div class="dft-arrangement__preview">',
            '                        <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.arrangement.preview\') }}</span>',
            '                        <div v-for="(row, rowIndex) in previewRows"',
            '                             :key="rowIndex"',
            '                             class="dft-preview"',
            '                             :style="{ gridTemplateColumns: \'repeat(\' + row.columns + \', minmax(0, 1fr))\' }">',
            '                            <div v-for="(block, blockIndex) in row.blocks"',
            '                                 :key="blockIndex"',
            '                                 class="dft-preview__block"',
            '                                 :class="\'is--\' + block.kind"',
            '                                 :style="Object.assign({}, block.style || {}, block.full ? { gridColumn: \'1 / -1\' } : (block.span > 1 ? { gridColumn: \'span \' + block.span } : {}))">',
            '                                <span class="dft-preview__label">{{ block.label }}</span>',
            '                                <template v-for="(entry, entryIndex) in block.items" :key="entryIndex">',
            '                                    <img v-if="entry.src"',
            '                                         class="dft-preview__img"',
            '                                         :class="\'is--\' + entry.align"',
            '                                         :src="entry.src"',
            '                                         :style="entry.style"',
            '                                         alt=""',
            '                                         draggable="false">',
            '                                    <span v-else-if="entry.text" class="dft-preview__text">{{ entry.text }}</span>',
            '                                    <span v-else class="dft-preview__text is--placeholder">{{ entry.placeholder }}</span>',
            '                                </template>',
            '                            </div>',
            '                        </div>',
            '                    </div>',
            '                </div>',
            '            </mt-card>',
            '',
            '            <mt-card :title="$tc(\'dmx4all-footer-tool.builder.areasTitle\')" :is-loading="isLoading">',
            '                <p class="dft-muted dft-grid-hint">{{ tr(\'dmx4all-footer-tool.builder.gridHint\', { columns: adminColumns }) }}</p>',
            '                <p v-if="isInline" class="dft-muted dft-grid-hint">{{ $tc(\'dmx4all-footer-tool.core.hint\') }}</p>',
            '',
            '                <div v-if="isInline && hiddenCore.length" class="dft-existing dft-hidden-core">',
            '                    <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.core.hiddenTitle\') }}</span>',
            '                    <button v-for="entry in hiddenCore"',
            '                            :key="entry.id"',
            '                            type="button"',
            '                            class="dft-chip"',
            '                            :title="$tc(\'dmx4all-footer-tool.core.show\')"',
            '                            @click="onShowCore(entry)">+ {{ coreLabel(entry) }}</button>',
            '                </div>',
            '',
            '                <div class="dft-grid"',
            '                     :class="{ \'is--dragging\': !!drag }"',
            '                     :style="{ gridTemplateColumns: \'repeat(\' + adminColumns + \', minmax(0, 1fr))\' }">',
            '                    <template v-for="(area, areaIndex) in layout.areas" :key="area.id">',
            '                        <div v-if="isVisibleEntry(area)"',
            '                             class="dft-area"',
            '                             :class="{ \'is--core\': area.type === \'core\', \'is--locked\': area.type === \'core\' && (area.mode || \'default\') === \'default\', \'is--target\': dropTarget && dropTarget.area === areaIndex, \'is--area-dragging\': isAreaDragged(areaIndex), \'is--area-drop\': areaDrop === areaIndex, \'is--full\': area.span === \'full\' }"',
            '                             :style="{ gridColumn: areaGridColumn(area) }"',
            '                             :data-area-index="areaIndex">',
            '',
            '                            <div class="dft-area__head">',
            '                                <span class="dft-area__title"',
            '                                      :title="$tc(\'dmx4all-footer-tool.builder.areaDrag\')"',
            '                                      @dragstart.prevent',
            '                                      @pointerdown="onPointerDown($event, { source: \'area\', area: areaIndex })">',
            '                                    <span class="dft-grip" aria-hidden="true"></span>',
            '                                    <span class="dft-area__title-text" :title="entryTitle(area, areaIndex)">{{ entryTitle(area, areaIndex) }}</span>',
            '                                </span>',
            '                                <div class="dft-area__tools">',
            '                                    <button type="button"',
            '                                            class="dft-icon-button dft-design-button"',
            '                                            :class="{ \'is--set\': hasDesign(area) }"',
            '                                            :title="$tc(\'dmx4all-footer-tool.design.open\')"',
            '                                            @click="onEditDesign(area, areaIndex)">',
            '                                        <span class="dft-design-button__swatch" :style="designSwatchStyle(area)"></span>',
            '                                    </button>',
            '                                    <button type="button" class="dft-icon-button"',
            '                                            :disabled="!canMove(areaIndex, -1)"',
            '                                            :title="$tc(\'dmx4all-footer-tool.builder.areaMoveLeft\')"',
            '                                            @click="onMoveArea(areaIndex, -1)">',
            '                                        <mt-icon name="regular-chevron-left-s" size="12px" />',
            '                                    </button>',
            '                                    <button type="button" class="dft-icon-button"',
            '                                            :disabled="!canMove(areaIndex, 1)"',
            '                                            :title="$tc(\'dmx4all-footer-tool.builder.areaMoveRight\')"',
            '                                            @click="onMoveArea(areaIndex, 1)">',
            '                                        <mt-icon name="regular-chevron-right-s" size="12px" />',
            '                                    </button>',
            '                                    <button v-if="area.type === \'core\' && isOutsideKey(area.key)" type="button" class="dft-icon-button"',
            '                                            :title="$tc(\'dmx4all-footer-tool.core.moveOut\')"',
            '                                            @click="onMoveOutOfRow(area)">',
            '                                        <mt-icon name="regular-chevron-down-s" size="12px" />',
            '                                    </button>',
            '                                    <button v-if="area.type === \'core\'" type="button" class="dft-icon-button is--danger"',
            '                                            :title="$tc(\'dmx4all-footer-tool.core.hide\')"',
            '                                            @click="onHideCore(area)">',
            '                                        <mt-icon name="regular-eye-slash" size="12px" />',
            '                                    </button>',
            '                                    <button v-else type="button" class="dft-icon-button is--danger"',
            '                                            :disabled="ownAreaCount <= 1"',
            '                                            :title="$tc(\'dmx4all-footer-tool.builder.areaRemove\')"',
            '                                            @click="onRemoveArea(areaIndex)">',
            '                                        <mt-icon name="regular-times-s" size="12px" />',
            '                                    </button>',
            '                                </div>',
            '                            </div>',
            '',
            '                            <div v-if="area.type === \'core\'" class="dft-core-head">',
            '                                <div class="dft-core-head__row">',
            '                                    <span class="dft-core-badge">{{ $tc(\'dmx4all-footer-tool.core.badge\') }}</span>',
            '                                    <select class="dft-core-mode"',
            '                                            :title="$tc(\'dmx4all-footer-tool.core.modeLabel\')"',
            '                                            :value="area.mode || \'default\'"',
            '                                            @change="onCoreModeChange(area, $event.target.value)">',
            '                                        <option v-for="option in coreModeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>',
            '                                    </select>',
            '                                </div>',
            '                                <button v-if="hasHeadline(area)"',
            '                                        type="button"',
            '                                        class="dft-core-headline"',
            '                                        :title="$tc(\'dmx4all-footer-tool.core.headlineEdit\')"',
            '                                        @click="onEditHeadline(area)">',
            '                                    <mt-icon name="regular-pencil-s" size="12px" />',
            '                                    <span v-if="headlinePreview(area)">{{ headlinePreview(area) }}</span>',
            '                                    <span v-else class="dft-muted">{{ $tc(\'dmx4all-footer-tool.core.headlineDefault\') }}</span>',
            '                                </button>',
            '                                <p v-if="(area.mode || \'default\') === \'default\'" class="dft-muted dft-core-note">{{ $tc(\'dmx4all-footer-tool.core.text\') }}</p>',
            '                                <p v-else class="dft-muted dft-core-note">{{ $tc(\'dmx4all-footer-tool.core.mode_\' + area.mode + \'_hint\') }}</p>',
            '                                <p v-if="area.mode === \'replace\' && !hasVisibleItems(area)" class="dft-core-fallback">{{ $tc(\'dmx4all-footer-tool.core.replaceFallback\') }}</p>',
            '                            </div>',
            '',
            '                            <div v-if="area.type !== \'core\' || (area.mode && area.mode !== \'default\')" class="dft-area__body" :class="{ \'is--drop-end\': isDropAt(areaIndex, area.items.length) }">',
            '                                <template v-for="(item, itemIndex) in area.items" :key="item.id">',
            '                                    <div class="dft-item"',
            '                                         :class="{ \'is--dragging\': isDragged(areaIndex, itemIndex), \'is--drop-before\': isDropAt(areaIndex, itemIndex), \'is--empty\': isEmptyItem(item) }"',
            '                                         @dragstart.prevent',
            '                                         @pointerdown="onPointerDown($event, { source: \'item\', area: areaIndex, index: itemIndex })"',
            '                                         @dblclick="onEdit(areaIndex, itemIndex)">',
            '                                        <span class="dft-grip" aria-hidden="true"></span>',
            '                                        <div class="dft-item__preview">',
            '                                            <template v-if="item.type === \'image\'">',
            '                                                <img v-if="mediaUrl(item.mediaId)" class="dft-item__thumb" :src="mediaUrl(item.mediaId)" alt="" draggable="false">',
            '                                                <span v-else class="dft-muted">{{ $tc(\'dmx4all-footer-tool.builder.noImage\') }}</span>',
            '                                                <span v-if="item.width || item.height" class="dft-item__size">{{ sizeLabel(item) }}</span>',
            '                                            </template>',
            '                                            <span v-else class="dft-item__text">{{ textPreview(item) }}</span>',
            '                                            <span v-if="isEmptyItem(item)" class="dft-item__missing">{{ $tc(\'dmx4all-footer-tool.builder.emptyHint\') }}</span>',
            '                                            <span v-else-if="missingLanguages(item).length" class="dft-item__missing">',
            '                                                {{ $tc(\'dmx4all-footer-tool.translation.missingShort\') }} {{ missingLanguages(item).join(\', \') }}',
            '                                            </span>',
            '                                        </div>',
            '                                        <div class="dft-item__actions">',
            '                                            <button type="button" class="dft-icon-button"',
            '                                                    :title="$tc(\'dmx4all-footer-tool.builder.edit\')"',
            '                                                    @click="onEdit(areaIndex, itemIndex)">',
            '                                                <mt-icon name="regular-pencil-s" size="14px" />',
            '                                            </button>',
            '                                            <button type="button" class="dft-icon-button is--danger"',
            '                                                    :title="$tc(\'dmx4all-footer-tool.builder.remove\')"',
            '                                                    @click="onRemove(areaIndex, itemIndex)">',
            '                                                <mt-icon name="regular-trash" size="14px" />',
            '                                            </button>',
            '                                        </div>',
            '                                    </div>',
            '                                </template>',
            '                                <p v-if="!area.items.length" class="dft-area__empty">{{ $tc(\'dmx4all-footer-tool.builder.dropHere\') }}</p>',
            '                            </div>',
            '',
            '                            <div class="dft-area__add">',
            '                                <template v-if="area.type !== \'core\' || (area.mode && area.mode !== \'default\')">',
            '                                    <button type="button" class="dft-link" @click="onAdd(\'text\', areaIndex)">{{ $tc(\'dmx4all-footer-tool.builder.addText\') }}</button>',
            '                                    <button type="button" class="dft-link" @click="onAdd(\'image\', areaIndex)">{{ $tc(\'dmx4all-footer-tool.builder.addImage\') }}</button>',
            '                                </template>',
            '                                <select class="dft-span"',
            '                                        :title="$tc(\'dmx4all-footer-tool.builder.areaWidth\')"',
            '                                        :value="String(area.span)"',
            '                                        @change="onSpanChange(area, $event.target.value)">',
            '                                    <option v-for="option in spanOptions(area)" :key="option.value" :value="option.value">{{ option.label }}</option>',
            '                                </select>',
            '                            </div>',
            '                        </div>',
            '                    </template>',
            '',
            '                    <button v-if="ownAreaCount < maxAreas"',
            '                            type="button"',
            '                            class="dft-area-add"',
            '                            :class="{ \'is--area-drop\': areaDrop === layout.areas.length }"',
            '                            @click="onAddArea">',
            '                        <span class="dft-area-add__plus">+</span>',
            '                        {{ $tc(\'dmx4all-footer-tool.builder.areaAdd\') }}',
            '                    </button>',
            '                </div>',
            '',
            '                <div v-if="isInline && outsideCore.length" class="dft-outside">',
            '                    <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.core.outsideTitle\') }}</span>',
            '                    <p class="dft-muted">{{ $tc(\'dmx4all-footer-tool.core.outsideText\') }}</p>',
            '                    <div v-for="entry in outsideCore" :key="entry.id" class="dft-outside__item">',
            '                        <span class="dft-core-badge">{{ $tc(\'dmx4all-footer-tool.core.badge\') }}</span>',
            '                        <strong>{{ coreLabel(entry) }}</strong>',
            '                        <span class="dft-outside__actions">',
            '                            <button type="button" class="dft-link" @click="onMoveIntoRow(entry)">{{ $tc(\'dmx4all-footer-tool.core.moveIn\') }}</button>',
            '                            <button type="button" class="dft-link" @click="onHideCore(entry)">{{ $tc(\'dmx4all-footer-tool.core.hide\') }}</button>',
            '                        </span>',
            '                    </div>',
            '                </div>',
            '            </mt-card>',
            '        </sw-card-view>',
            '',
            '        <sw-modal v-if="editing"',
            '                  class="dft-modal"',
            '                  variant="large"',
            '                  :title="editing.item.type === \'image\' ? $tc(\'dmx4all-footer-tool.builder.modalImage\') : $tc(\'dmx4all-footer-tool.builder.modalText\')"',
            '                  @modal-close="onEditCancel">',
            '',
            '            <div class="dft-langs">',
            '                <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.translation.language\') }}</span>',
            '                <div class="dft-langs__tabs">',
            '                    <button v-for="language in sortedLanguages"',
            '                            :key="language.id"',
            '                            type="button"',
            '                            class="dft-langs__tab"',
            '                            :class="{ \'is--active\': language.id === editing.languageId, \'is--missing\': !hasTranslation(editing.item, language.id) }"',
            '                            :title="hasTranslation(editing.item, language.id) ? \'\' : $tc(\'dmx4all-footer-tool.translation.missing\')"',
            '                            @click="editing.languageId = language.id">',
            '                        {{ language.name }}',
            '                        <span v-if="language.id === systemLanguage" class="dft-langs__default">{{ $tc(\'dmx4all-footer-tool.translation.default\') }}</span>',
            '                    </button>',
            '                </div>',
            '                <p class="dft-muted">{{ $tc(\'dmx4all-footer-tool.translation.hint\') }}</p>',
            '            </div>',
            '',
            '            <template v-if="editing.item.type === \'text\'">',
            '                <sw-text-editor :key="\'editor-\' + editing.languageId"',
            '                                :value="editing.item.content[editing.languageId] || \'\'"',
            '                                @update:value="onTextChange" />',
            '            </template>',
            '',
            '            <template v-else>',
            '                <sw-upload-listener :upload-tag="uploadTag"',
            '                                    auto-upload',
            '                                    @media-upload-finish="onUploadFinish" />',
            '                <sw-media-upload-v2 :upload-tag="uploadTag"',
            '                                    :source="editing.item.mediaId"',
            '                                    :allow-multi-select="false"',
            '                                    :label="$tc(\'dmx4all-footer-tool.builder.imageLabel\')"',
            '                                    variant="regular"',
            '                                    default-folder="cms_page"',
            '                                    @media-upload-sidebar-open="showMediaModal = true"',
            '                                    @media-upload-remove-image="onRemoveImage"',
            '                                    @media-drop="onMediaDrop" />',
            '',
            '                <div class="dft-modal__fields">',
            '                    <mt-text-field v-model="editing.item.alt[editing.languageId]"',
            '                                   :label="$tc(\'dmx4all-footer-tool.builder.altLabel\')"',
            '                                   :help-text="$tc(\'dmx4all-footer-tool.builder.altHelp\')" />',
            '                    <mt-text-field v-model="editing.item.link[editing.languageId]"',
            '                                   :label="$tc(\'dmx4all-footer-tool.builder.linkLabel\')"',
            '                                   :placeholder="$tc(\'dmx4all-footer-tool.builder.linkPlaceholder\')" />',
            '                    <mt-switch v-model="editing.item.newTab"',
            '                               :label="$tc(\'dmx4all-footer-tool.builder.newTabLabel\')" />',
            '                    <div class="dft-field">',
            '                        <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.size.title\') }}</span>',
            '                        <div class="dft-size">',
            '                            <label class="dft-size__part">',
            '                                <span>{{ $tc(\'dmx4all-footer-tool.size.width\') }}</span>',
            '                                <input class="dft-select dft-size__input" type="number" min="1" :max="editing.widthUnit === \'%\' ? 100 : 2000" step="1"',
            '                                       v-model="editing.width" :placeholder="$tc(\'dmx4all-footer-tool.size.auto\')">',
            '                                <select class="dft-select dft-size__unit" v-model="editing.widthUnit">',
            '                                    <option value="px">px</option>',
            '                                    <option value="%">%</option>',
            '                                </select>',
            '                            </label>',
            '                            <span class="dft-size__times" aria-hidden="true">&times;</span>',
            '                            <label class="dft-size__part">',
            '                                <span>{{ $tc(\'dmx4all-footer-tool.size.height\') }}</span>',
            '                                <input class="dft-select dft-size__input" type="number" min="1" max="2000" step="1"',
            '                                       v-model="editing.height" :placeholder="$tc(\'dmx4all-footer-tool.size.auto\')">',
            '                                <span class="dft-size__suffix">px</span>',
            '                            </label>',
            '                            <button v-if="editing.width || editing.height" type="button" class="dft-link" @click="editing.width = \'\'; editing.height = \'\'">',
            '                                {{ $tc(\'dmx4all-footer-tool.size.reset\') }}',
            '                            </button>',
            '                        </div>',
            '                        <p class="dft-muted">{{ $tc(\'dmx4all-footer-tool.size.help\') }}</p>',
            '                    </div>',
            '',
            '                    <div class="dft-field">',
            '                        <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.builder.alignLabel\') }}</span>',
            '                        <div class="dft-segment">',
            '                            <button v-for="option in alignOptions"',
            '                                    :key="option.value"',
            '                                    type="button"',
            '                                    :class="{ \'is--active\': editing.item.align === option.value }"',
            '                                    @click="editing.item.align = option.value">{{ option.label }}</button>',
            '                        </div>',
            '                    </div>',
            '                </div>',
            '            </template>',
            '',
            '            <template #modal-footer>',
            '                <mt-button variant="secondary" size="small" @click="onEditCancel">',
            '                    {{ $tc(\'dmx4all-footer-tool.builder.modalCancel\') }}',
            '                </mt-button>',
            '                <mt-button variant="primary" size="small" @click="onEditApply">',
            '                    {{ $tc(\'dmx4all-footer-tool.builder.modalApply\') }}',
            '                </mt-button>',
            '            </template>',
            '        </sw-modal>',
            '',
            '        <sw-modal v-if="headlineEditing"',
            '                  class="dft-modal"',
            '                  :title="$tc(\'dmx4all-footer-tool.core.headlineTitle\') + \': \' + coreLabel(headlineEditing.entry)"',
            '                  @modal-close="headlineEditing = null">',
            '            <div class="dft-langs">',
            '                <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.translation.language\') }}</span>',
            '                <div class="dft-langs__tabs">',
            '                    <button v-for="language in sortedLanguages"',
            '                            :key="language.id"',
            '                            type="button"',
            '                            class="dft-langs__tab"',
            '                            :class="{ \'is--active\': language.id === headlineEditing.languageId, \'is--missing\': !headlineEditing.values[language.id] }"',
            '                            @click="headlineEditing.languageId = language.id">',
            '                        {{ language.name }}',
            '                        <span v-if="language.id === systemLanguage" class="dft-langs__default">{{ $tc(\'dmx4all-footer-tool.translation.default\') }}</span>',
            '                    </button>',
            '                </div>',
            '            </div>',
            '            <mt-text-field v-model="headlineEditing.values[headlineEditing.languageId]"',
            '                           :label="$tc(\'dmx4all-footer-tool.core.headlineField\')"',
            '                           :help-text="$tc(\'dmx4all-footer-tool.core.headlineHelp\')" />',
            '',
            '            <template #modal-footer>',
            '                <mt-button variant="secondary" size="small" @click="headlineEditing = null">',
            '                    {{ $tc(\'dmx4all-footer-tool.builder.modalCancel\') }}',
            '                </mt-button>',
            '                <mt-button variant="primary" size="small" @click="onHeadlineApply">',
            '                    {{ $tc(\'dmx4all-footer-tool.builder.modalApply\') }}',
            '                </mt-button>',
            '            </template>',
            '        </sw-modal>',
            '',
            '        <sw-modal v-if="designEditing"',
            '                  class="dft-modal dft-design-modal"',
            '                  variant="large"',
            '                  :title="$tc(\'dmx4all-footer-tool.design.title\') + \': \' + designEditing.title"',
            '                  @modal-close="designEditing = null">',
            '            <div class="dft-design">',
            '                <div class="dft-design__fields">',
            '                    <fieldset v-for="group in designGroups" :key="group.key" class="dft-design__group">',
            '                        <legend>{{ group.label }}</legend>',
            '                        <div v-for="field in group.fields" :key="field.key" class="dft-design__row">',
            '                            <label class="dft-design__label" :for="\'dft-design-\' + field.key">{{ $tc(\'dmx4all-footer-tool.design.field_\' + field.key) }}</label>',
            '',
            '                            <div v-if="field.type === \'color\'" class="dft-design__color">',
            '                                <input type="color"',
            '                                       class="dft-design__picker"',
            '                                       :value="colorPickerValue(designEditing.values[field.key])"',
            '                                       @input="designEditing.values[field.key] = $event.target.value">',
            '                                <input :id="\'dft-design-\' + field.key"',
            '                                       type="text"',
            '                                       class="dft-select dft-design__input"',
            '                                       :placeholder="$tc(\'dmx4all-footer-tool.design.theme\')"',
            '                                       v-model="designEditing.values[field.key]">',
            '                            </div>',
            '',
            '                            <div v-else-if="field.type === \'select\'" class="dft-design__color">',
            '                                <select :id="\'dft-design-\' + field.key" class="dft-select dft-design__input" v-model="designEditing.values[field.key]">',
            '                                    <option value="">{{ $tc(\'dmx4all-footer-tool.design.theme\') }}</option>',
            '                                    <option v-for="option in field.options" :key="option" :value="option">{{ designOptionLabel(field.key, option) }}</option>',
            '                                </select>',
            '                            </div>',
            '',
            '                            <div v-else class="dft-design__color">',
            '                                <input :id="\'dft-design-\' + field.key"',
            '                                       type="number"',
            '                                       class="dft-select dft-design__input"',
            '                                       :min="field.min" :max="field.max" :step="field.step || 1"',
            '                                       :placeholder="$tc(\'dmx4all-footer-tool.design.theme\')"',
            '                                       v-model="designEditing.values[field.key]">',
            '                                <span v-if="field.type === \'px\'" class="dft-size__suffix">px</span>',
            '                            </div>',
            '',
            '                            <button v-if="designEditing.values[field.key] !== \'\' && designEditing.values[field.key] !== undefined"',
            '                                    type="button"',
            '                                    class="dft-icon-button"',
            '                                    :title="$tc(\'dmx4all-footer-tool.design.clear\')"',
            '                                    @click="designEditing.values[field.key] = \'\'">&times;</button>',
            '                        </div>',
            '                    </fieldset>',
            '                </div>',
            '',
            '                <div class="dft-design__preview">',
            '                    <span class="dft-field__label">{{ $tc(\'dmx4all-footer-tool.design.preview\') }}</span>',
            '                    <div class="dft-design__sample" :style="designPreviewStyle">',
            '                        <div class="dft-design__sample-heading" :style="designEditing.previewHeadingStyle">{{ $tc(\'dmx4all-footer-tool.design.sampleHeading\') }}</div>',
            '                        <p>{{ $tc(\'dmx4all-footer-tool.design.sampleText\') }}</p>',
            '                        <a href="#"',
            '                           :style="designPreviewLinkStyle"',
            '                           @click.prevent',
            '                           @mouseenter="designEditing.hover = true"',
            '                           @mouseleave="designEditing.hover = false">{{ $tc(\'dmx4all-footer-tool.design.sampleLink\') }}</a>',
            '                    </div>',
            '                    <p class="dft-muted">{{ $tc(\'dmx4all-footer-tool.design.hint\') }}</p>',
            '                </div>',
            '            </div>',
            '',
            '            <template #modal-footer>',
            '                <mt-button variant="secondary" size="small" @click="onDesignReset">',
            '                    {{ $tc(\'dmx4all-footer-tool.design.reset\') }}',
            '                </mt-button>',
            '                <mt-button variant="secondary" size="small" @click="designEditing = null">',
            '                    {{ $tc(\'dmx4all-footer-tool.builder.modalCancel\') }}',
            '                </mt-button>',
            '                <mt-button variant="primary" size="small" @click="onDesignApply">',
            '                    {{ $tc(\'dmx4all-footer-tool.builder.modalApply\') }}',
            '                </mt-button>',
            '            </template>',
            '        </sw-modal>',
            '',
            '        <sw-modal v-if="showExportChoice"',
            '                  class="dft-confirm"',
            '                  variant="small"',
            '                  :title="$tc(\'dmx4all-footer-tool.transfer.exportTitle\')"',
            '                  @modal-close="showExportChoice = false">',
            '            <div class="dft-export-choice">',
            '                <button type="button" class="dft-export-option" @click="onExportChoice(false)">',
            '                    <strong>{{ $tc(\'dmx4all-footer-tool.transfer.exportThis\') }}</strong>',
            '                    <span>{{ layoutName || $tc(\'dmx4all-footer-tool.layouts.unnamed\') }}</span>',
            '                </button>',
            '                <button type="button" class="dft-export-option" @click="onExportChoice(true)">',
            '                    <strong>{{ $tc(\'dmx4all-footer-tool.transfer.exportEvery\') }}</strong>',
            '                    <span>{{ tr(\'dmx4all-footer-tool.transfer.exportEveryHint\', { count: exportAllCount }) }}</span>',
            '                </button>',
            '            </div>',
            '',
            '            <template #modal-footer>',
            '                <mt-button variant="secondary" size="small" @click="showExportChoice = false">',
            '                    {{ $tc(\'dmx4all-footer-tool.builder.modalCancel\') }}',
            '                </mt-button>',
            '            </template>',
            '        </sw-modal>',
            '',
            '        <sw-modal v-if="importState"',
            '                  class="dft-modal"',
            '                  :title="$tc(\'dmx4all-footer-tool.transfer.importTitle\')"',
            '                  @modal-close="importState = null">',
            '            <p class="dft-muted">{{ tr(\'dmx4all-footer-tool.transfer.importFound\', { count: importState.layouts.length, file: importState.fileName }) }}</p>',
            '',
            '            <div class="dft-import-list">',
            '                <label v-for="(entry, index) in importState.layouts" :key="index" class="dft-import-row">',
            '                    <input type="checkbox" v-model="entry.selected">',
            '                    <span class="dft-import-row__name">{{ entry.name || $tc(\'dmx4all-footer-tool.layouts.unnamed\') }}</span>',
            '                    <span class="dft-import-row__scope">{{ importScopeLabel(entry) }}</span>',
            '                </label>',
            '            </div>',
            '',
            '            <label v-if="importState.config" class="dft-import-option">',
            '                <input type="checkbox" v-model="importState.applyConfig">',
            '                <span>{{ $tc(\'dmx4all-footer-tool.transfer.applyConfig\') }}</span>',
            '            </label>',
            '',
            '            <p class="dft-muted">{{ $tc(\'dmx4all-footer-tool.transfer.importHint\') }}</p>',
            '',
            '            <template #modal-footer>',
            '                <mt-button variant="secondary" size="small" @click="importState = null">',
            '                    {{ $tc(\'dmx4all-footer-tool.builder.modalCancel\') }}',
            '                </mt-button>',
            '                <mt-button variant="primary" size="small" :is-loading="isTransferring" :disabled="!importSelectedCount" @click="onImportConfirm">',
            '                    {{ tr(\'dmx4all-footer-tool.transfer.importButton\', { count: importSelectedCount }) }}',
            '                </mt-button>',
            '            </template>',
            '        </sw-modal>',
            '',
            DOC_MODAL_TEMPLATE,
            '        <sw-modal v-if="confirmState"',
            '                  class="dft-confirm"',
            '                  variant="small"',
            '                  :title="confirmState.title"',
            '                  @modal-close="onConfirmAnswer(false)">',
            '            <p class="dft-confirm__text">{{ confirmState.message }}</p>',
            '',
            '            <template #modal-footer>',
            '                <mt-button variant="secondary" size="small" @click="onConfirmAnswer(false)">',
            '                    {{ $tc(\'dmx4all-footer-tool.builder.modalCancel\') }}',
            '                </mt-button>',
            '                <mt-button :variant="confirmState.danger ? \'critical\' : \'primary\'" size="small" @click="onConfirmAnswer(true)">',
            '                    {{ confirmState.confirmLabel }}',
            '                </mt-button>',
            '            </template>',
            '        </sw-modal>',
            '',
            '        <div v-if="undoState" class="dft-undo" role="status" aria-live="polite">',
            '            <span>{{ undoState.message }}</span>',
            '            <button type="button" class="dft-undo__button" @click="onUndo">{{ $tc(\'dmx4all-footer-tool.undo.button\') }}</button>',
            '            <button type="button" class="dft-undo__close" :title="$tc(\'dmx4all-footer-tool.builder.modalCancel\')" @click="clearUndo">&times;</button>',
            '        </div>',
            '',
            '        <sw-media-modal-v2 v-if="showMediaModal"',
            '                           :allow-multi-select="false"',
            '                           @media-modal-selection-change="onMediaSelected"',
            '                           @modal-close="showMediaModal = false" />',
            '    </template>',
            '</sw-page>'
        ].join('\n'),

        inject: ['repositoryFactory', 'cacheApiService', 'systemConfigApiService', 'acl'],

        mixins: [Shopware.Mixin.getByName('notification'), DOC_MIXIN],

        data: function () {
            return {
                isLoading: false,
                isSaving: false,
                isDirty: false,
                salesChannels: [],
                languages: [],
                records: [],
                /* Geltungsbereich des aktuellen Layouts (leer = alle) */
                channelIds: [],
                languageIds: [],
                /* Abgeleitet: genau ein Kanal/eine Sprache, sonst leer (fuer Anordnung, Navigation, Vorschau) */
                salesChannelId: '',
                languageId: '',
                layout: emptyLayout(),
                mediaMap: {},
                drag: null,
                dropTarget: null,
                areaDrop: null,
                currentId: null,
                isTransferring: false,
                showExportChoice: false,
                importState: null,
                layoutName: '',
                layoutActive: true,
                headlineEditing: null,
                designEditing: null,
                confirmState: null,
                undoState: null,
                undoTimer: null,
                autosaveDelay: readAutosaveDelay(),
                autosaveAt: 0,
                autosaveRemaining: 0,
                autosaveTimer: null,
                lastSavedAt: null,
                saveFailed: false,
                navCategories: [],
                legacyConfig: {},
                editing: null,
                showMediaModal: false,
                isConfigLoading: false,
                configSnapshot: '',
                forceConfigSave: false,
                globalConfig: {},
                channelConfig: {},
                config: Object.assign({}, CONFIG_DEFAULTS)
            };
        },

        computed: {
            pluginVersion: function () {
                return PLUGIN_VERSION;
            },

            layoutRepository: function () {
                return this.repositoryFactory.create(ENTITY);
            },

            mediaRepository: function () {
                return this.repositoryFactory.create('media');
            },

            /* Das Layout genau fuer die aktuelle Auswahl */
            /* Das Layout, das gerade bearbeitet wird (null = neu, noch nicht gespeichert) */
            record: function () {
                var id = this.currentId;

                return id ? (this.records.find(function (entry) { return entry.id === id; }) || null) : null;
            },

            /* Anzahl beim Export "Alle": gespeicherte plus ein noch neues Layout */
            exportAllCount: function () {
                return this.records.length + (this.currentId ? 0 : 1);
            },

            designGroups: function () {
                var that = this;

                return ['box', 'text', 'link'].map(function (group) {
                    return {
                        key: group,
                        label: that.$tc('dmx4all-footer-tool.design.group_' + group),
                        fields: DESIGN_FIELDS.filter(function (field) { return field.group === group; })
                    };
                });
            },

            /* Live-Vorschau im Design-Dialog */
            designPreviewStyle: function () {
                return this.designEditing ? designBoxStyle(normalizeDesign(this.designEditing.values)) : {};
            },

            designPreviewLinkStyle: function () {
                if (!this.designEditing) {
                    return {};
                }

                var d = normalizeDesign(this.designEditing.values);
                var hover = this.designEditing.hover;
                var style = {};
                var color = hover ? (d.linkHoverColor || d.linkColor) : d.linkColor;
                var decoration = hover ? (d.linkHoverDecoration || d.linkDecoration) : d.linkDecoration;

                if (color) {
                    style.color = color;
                }

                if (decoration) {
                    style.textDecoration = decoration;
                }

                return style;
            },

            importSelectedCount: function () {
                return this.importState ? this.importState.layouts.filter(function (entry) { return entry.selected; }).length : 0;
            },

            sortedRecords: function () {
                return this.records.slice().sort(function (a, b) {
                    return String(a.name || '').localeCompare(String(b.name || ''));
                });
            },

            /* Was der Shop fuer den Geltungsbereich dieses Layouts zeigt */
            layoutStatus: function () {
                if (!this.record) {
                    return { kind: 'new', text: this.$tc('dmx4all-footer-tool.layouts.statusNew') };
                }

                if (this.record.active && this.scopeProblem(entryChannels(this.record), entryLanguages(this.record)) === 'nowhere') {
                    return { kind: 'nowhere', text: this.$tc('dmx4all-footer-tool.layouts.statusNowhere') };
                }

                if (this.record.active) {
                    return {
                        kind: 'live',
                        text: this.tr('dmx4all-footer-tool.layouts.statusLive', {
                            scope: this.entryScopeLabel(this.record)
                        })
                    };
                }

                var fallback = this.fallbackRecord;

                return {
                    kind: 'inactive',
                    text: fallback
                        ? this.tr('dmx4all-footer-tool.layouts.statusInactive', { name: fallback.name || this.$tc('dmx4all-footer-tool.layouts.unnamed') })
                        : this.$tc('dmx4all-footer-tool.layouts.statusInactiveNone')
                };
            },

            /* Was der Shop zeigt, wenn es fuer die Auswahl kein eigenes Layout gibt */
            fallbackRecord: function () {
                var that = this;
                /* Stellvertretend den ersten Kanal / die erste Sprache des Layouts pruefen */
                var sc = this.channelIds[0] || null;
                var lang = this.languageIds[0] || null;
                var best = null;
                var bestScore = -1;

                this.records.forEach(function (entry) {
                    var channels = entryChannels(entry);
                    var languages = entryLanguages(entry);

                    if (!entry.active || entry.id === that.currentId) {
                        return;
                    }

                    if (channels.length && (sc === null || channels.indexOf(sc) === -1)) {
                        return;
                    }

                    if (languages.length && (lang === null || languages.indexOf(lang) === -1)) {
                        return;
                    }

                    var score = (channels.length ? 2 : 0) + (languages.length ? 1 : 0);

                    if (score > bestScore) {
                        best = entry;
                        bestScore = score;
                    }
                });

                return best;
            },

            /* Was ein Verkaufskanal ohne eigene Werte erbt */
            inheritedConfig: function () {
                return Object.assign({}, CONFIG_DEFAULTS, this.globalConfig);
            },

            configDirty: function () {
                return this.forceConfigSave || JSON.stringify(this.config) !== this.configSnapshot;
            },

            hasOwnConfig: function () {
                return !!this.salesChannelId && Object.keys(this.channelConfig).length > 0;
            },

            placementOptions: function () {
                var that = this;

                return ['inline', 'replace', 'before', 'after'].map(function (value) {
                    var key = 'placement' + value.charAt(0).toUpperCase() + value.substring(1);

                    return { value: value, label: that.$tc('dmx4all-footer-tool.arrangement.' + key) };
                });
            },

            columnFields: function () {
                return [
                    { key: 'columnsDesktop', label: this.$tc('dmx4all-footer-tool.arrangement.columnsDesktop') },
                    { key: 'columnsTablet', label: this.$tc('dmx4all-footer-tool.arrangement.columnsTablet') },
                    { key: 'columnsMobile', label: this.$tc('dmx4all-footer-tool.arrangement.columnsMobile') }
                ];
            },

            /* Schematische Desktop-Vorschau der Footer-Zeile(n) */
            previewRows: function () {
                var that = this;
                var config = this.config;
                var columns = clampColumns(config.columnsDesktop, 4);
                var inline = [];
                var own = [];
                var allOwn = [];
                var coreVisible = [];

                if (!config.active) {
                    return [{ columns: 1, blocks: [{ kind: 'core', label: this.$tc('dmx4all-footer-tool.arrangement.previewDefault'), items: [] }] }];
                }

                this.layout.areas.forEach(function (entry, index) {
                    var span = entry.span === 'full' ? columns : Math.min(normalizeSpan(entry.span), columns);

                    if (isCore(entry)) {
                        if (entry.hidden || (that.isInline && !that.isVisibleEntry(entry))) {
                            return;
                        }

                        /* Bei darueber/darunter/ersetzen bleiben Logos und Fussleiste unveraendert */
                        if (!that.isInline && isOutsideKey(entry.key)) {
                            return;
                        }

                        var coreItems = (entry.mode && entry.mode !== 'default')
                            ? entry.items.filter(function (item) { return !that.isEmptyItem(item); }).map(function (item) { return that.previewEntry(item); })
                            : [];
                        var coreBlock = {
                            style: designBoxStyle(normalizeDesign(entry.design)),
                            kind: 'core',
                            label: that.headlinePreview(entry) || that.coreLabel(entry),
                            items: coreItems,
                            full: entry.span === 'full',
                            span: span
                        };
                        coreVisible.push(coreBlock);
                        inline.push(coreBlock);

                        return;
                    }

                    /* Leere Elemente erscheinen im Shop nicht, also auch nicht in der Vorschau */
                    var items = entry.items.filter(function (item) {
                        return !that.isEmptyItem(item);
                    }).map(function (item) {
                        return that.previewEntry(item);
                    });

                    var block = {
                        style: designBoxStyle(normalizeDesign(entry.design)),
                        kind: items.length ? 'own' : 'empty',
                        items: items,
                        label: that.entryTitle(entry, index),
                        full: entry.span === 'full',
                        span: span
                    };

                    allOwn.push(block);

                    if (items.length) {
                        own.push(block);
                        inline.push(block);
                    }
                });

                if (config.placement === 'inline') {
                    if (!inline.length) {
                        inline.push({ kind: 'empty', label: this.$tc('dmx4all-footer-tool.arrangement.previewEmpty'), items: [], full: true });
                    }

                    var rows = [{ columns: columns, blocks: inline }];

                    /* Teile an ihrem Standardplatz unter der Zeile: Logos, dann Fussleiste */
                    [['payment', 'shipping'], ['servicemenu', 'vat', 'copyright']].forEach(function (group) {
                        var blocks = that.outsideCore.filter(function (entry) {
                            return group.indexOf(entry.key) !== -1;
                        }).map(function (entry) {
                            return { kind: 'core', label: that.coreLabel(entry), items: [] };
                        });

                        if (blocks.length) {
                            rows.push({ columns: blocks.length, blocks: blocks });
                        }
                    });

                    return rows;
                }

                var ownRow = {
                    columns: columns,
                    blocks: config.hideEmptyAreas ? own : allOwn
                };

                if (!ownRow.blocks.length) {
                    ownRow.blocks = [{ kind: 'empty', label: this.$tc('dmx4all-footer-tool.arrangement.previewEmpty'), items: [], full: true }];
                }

                var core = [];

                if (config.showHotline) {
                    core.push({ kind: 'core', label: this.$tc('dmx4all-footer-tool.arrangement.previewHotline'), items: [] });
                }

                if (config.showNavigation) {
                    core.push({ kind: 'core', label: this.$tc('dmx4all-footer-tool.arrangement.previewNavigation'), items: [] });
                }

                if (config.placement === 'replace' || !core.length) {
                    return [ownRow];
                }

                var coreRow = { columns: 3, blocks: core };

                return config.placement === 'before' ? [ownRow, coreRow] : [coreRow, ownRow];
            },

            autosaveOptions: function () {
                var that = this;

                return AUTOSAVE_CHOICES.map(function (value) {
                    return {
                        value: String(value),
                        label: value === 0
                            ? that.$tc('dmx4all-footer-tool.autosave.off')
                            : that.tr('dmx4all-footer-tool.autosave.seconds', { seconds: value })
                    };
                });
            },

            /* Anzeige oben rechts: was ist mit den Aenderungen los? */
            saveStatus: function () {
                var dirty = this.isDirty || this.configDirty;

                if (this.isSaving) {
                    return { kind: 'saving', text: this.$tc('dmx4all-footer-tool.autosave.saving') };
                }

                if (this.saveFailed) {
                    return { kind: 'error', text: this.$tc('dmx4all-footer-tool.autosave.failed') };
                }

                if (dirty && this.autosaveDelay > 0 && this.autosaveRemaining > 0) {
                    return {
                        kind: 'pending',
                        text: this.tr('dmx4all-footer-tool.autosave.pending', { seconds: this.autosaveRemaining })
                    };
                }

                if (dirty) {
                    return { kind: 'dirty', text: this.$tc('dmx4all-footer-tool.builder.unsaved') };
                }

                if (this.lastSavedAt) {
                    var time = pad2(this.lastSavedAt.getHours()) + ':' + pad2(this.lastSavedAt.getMinutes()) + ':' + pad2(this.lastSavedAt.getSeconds());

                    return { kind: 'saved', text: this.tr('dmx4all-footer-tool.autosave.savedAt', { time: time }) };
                }

                return { kind: 'saved', text: this.$tc('dmx4all-footer-tool.autosave.allSaved') };
            },

            coreModeOptions: function () {
                var that = this;

                return ['default', 'append', 'replace'].map(function (mode) {
                    return { value: mode, label: that.$tc('dmx4all-footer-tool.core.mode_' + mode) };
                });
            },

            /* Rechte; ohne acl-Dienst (aeltere Umgebung) ist alles erlaubt */
            canEdit: function () {
                return this.aclCan('dmx4all_footer_tool.editor');
            },

            canCreate: function () {
                return this.aclCan('dmx4all_footer_tool.creator');
            },

            canDelete: function () {
                return this.aclCan('dmx4all_footer_tool.deleter');
            },

            isInline: function () {
                return this.config.placement === 'inline';
            },

            ownAreaCount: function () {
                return this.layout.areas.filter(function (entry) { return !isCore(entry); }).length;
            },

            /* Logos und Fussleiste an ihrem Originalplatz unter der Zeile */
            outsideCore: function () {
                return this.layout.areas.filter(function (entry) {
                    return isCore(entry) && isOutsideKey(entry.key) && !entry.inRow && !entry.hidden;
                });
            },

            hiddenCore: function () {
                return this.layout.areas.filter(function (entry) { return isCore(entry) && entry.hidden; });
            },

            /* Das Raster im Admin hat so viele Spalten wie der Shop am Desktop */
            adminColumns: function () {
                return clampColumns(this.config.columnsDesktop, 4);
            },

            maxAreas: function () {
                return MAX_AREAS;
            },

            maxColumns: function () {
                return MAX_COLUMNS;
            },

            systemLanguage: function () {
                return systemLanguageId();
            },

            sortedLanguages: function () {
                var system = this.systemLanguage;

                return this.languages.slice().sort(function (a, b) {
                    if (a.id === system) {
                        return -1;
                    }

                    if (b.id === system) {
                        return 1;
                    }

                    return String(a.name).localeCompare(String(b.name));
                });
            },

            /* Sprache fuer Vorschautexte: aktuell gewaehlte, sonst Systemsprache */
            previewLanguage: function () {
                return this.languageId || this.systemLanguage;
            },

            uploadTag: function () {
                return 'dmx4all-footer-tool-' + (this.editing ? this.editing.item.id : 'none');
            },

            alignOptions: function () {
                return [
                    { value: 'left', label: this.$tc('dmx4all-footer-tool.builder.alignLeft') },
                    { value: 'center', label: this.$tc('dmx4all-footer-tool.builder.alignCenter') },
                    { value: 'right', label: this.$tc('dmx4all-footer-tool.builder.alignRight') }
                ];
            }
        },

        watch: {
            'designEditing.values': {
                deep: true,
                handler: function () {
                    this.updateDesignHeading();
                }
            },

            layout: {
                deep: true,
                handler: function () {
                    this.scheduleAutosave();
                }
            },

            config: {
                deep: true,
                handler: function () {
                    this.scheduleAutosave();
                }
            },

            isDirty: function () {
                this.scheduleAutosave();
            }
        },

        created: function () {
            this.loadAll();
        },

        beforeUnmount: function () {
            this.endPointerDrag();
            this.stopAutosave();
            this.clearUndo();

            /* Beim Verlassen der Seite offene Aenderungen noch sichern */
            if (this.autosaveDelay > 0 && (this.isDirty || this.configDirty) && !this.isSaving) {
                this.onSave({ auto: true });
            }
        },

        methods: {
            /*
             * Text mit Platzhaltern (%name%) holen. Nur $tc verwenden: $t gibt
             * es in der Shopware-6.7-Administration nicht, und die
             * {name}-Platzhalter von vue-i18n kommen ueber $tc nicht an.
             */
            tr: function (key, values) {
                var text = this.$tc(key);

                Object.keys(values || {}).forEach(function (name) {
                    text = text.split('%' + name + '%').join(String(values[name]));
                });

                return text;
            },

            /* -------------------------------------------------------------- */
            /* Laden                                                          */
            /* -------------------------------------------------------------- */

            /*
             * Alles unabhaengig voneinander laden: Scheitert ein Teil (z. B.
             * die Footer-Kategorien), bleiben Layouts und Einstellungen
             * trotzdem bedienbar. Die Meldung nennt, welcher Teil fehlte.
             */
            loadAll: function () {
                var that = this;
                var Criteria = Shopware.Data.Criteria;

                var channelCriteria = new Criteria(1, 100);
                channelCriteria.addSorting(Criteria.sort('name', 'ASC'));

                var languageCriteria = new Criteria(1, 100);
                languageCriteria.addSorting(Criteria.sort('name', 'ASC'));

                this.isLoading = true;

                var channels = this.searchWithFallback('sales_channel', channelCriteria, ['id', 'name', 'translated', 'footerCategoryId'])
                    .then(function (result) {
                        that.salesChannels = result;
                    })
                    .catch(function (error) {
                        that.reportLoadError('salesChannels', error);
                    });

                var languages = this.searchWithFallback('language', languageCriteria, ['id', 'name'])
                    .then(function (result) {
                        that.languages = result;
                    })
                    .catch(function (error) {
                        that.reportLoadError('languages', error);
                    });

                var records = this.loadRecords()
                    .catch(function (error) {
                        that.reportLoadError('layouts', error);
                    });

                return Promise.all([channels, languages, records])
                    .then(function () {
                        /* Anordnung haengt am Verkaufskanal des gewaehlten Layouts */
                        that.pickInitialLayout();

                        return that.loadConfig();
                    })
                    .then(function () {

                        /* Spalten der Footer-Navigation erst laden, wenn die Verkaufskanaele da sind */
                        return that.loadNavCategories();
                    })
                    .finally(function () {
                        that.isLoading = false;
                    });
            },

            /*
             * Suche mit Ausweichweg. Zuerst die normale Repository-Suche. Scheitert
             * sie beim Auswerten der Antwort (z. B. weil ein anderes Plugin eine
             * PHP-Warnung vor das JSON schreibt), wird dieselbe Suche als
             * schlichtes JSON wiederholt, vorangestellter Text abgeschnitten und
             * nur die benoetigten Felder abgefragt.
             *
             * Liefert immer ein Array einfacher Objekte.
             */
            searchWithFallback: function (entityName, criteria, fields) {
                var repository = this.repositoryFactory.create(entityName);

                return repository.search(criteria, Shopware.Context.api)
                    .then(function (result) {
                        return Array.from(result);
                    })
                    .catch(function (error) {
                        if (window.console && window.console.warn) {
                            window.console.warn('[Dmx4allFooterTool] ' + entityName + ': normale Suche fehlgeschlagen, versuche JSON-Abfrage', error);
                        }

                        if (typeof repository.buildHeaders !== 'function' || !repository.httpClient) {
                            throw error;
                        }

                        var headers = Object.assign({}, repository.buildHeaders(Shopware.Context.api), {
                            Accept: 'application/json'
                        });
                        var payload = criteria.parse();

                        if (fields && fields.length) {
                            payload.includes = {};
                            payload.includes[entityName] = fields;
                        }

                        return repository.httpClient.post('/search' + repository.route, payload, { headers: headers })
                            .then(function (response) {
                                var body = response.data;

                                if (typeof body === 'string') {
                                    var start = body.indexOf('{');

                                    if (window.console && window.console.warn) {
                                        window.console.warn('[Dmx4allFooterTool] ' + entityName + ': Antwort ist kein reines JSON, Anfang:', body.substring(0, 300));
                                    }

                                    body = start === -1 ? null : JSON.parse(body.substring(start));
                                }

                                if (!body || !Array.isArray(body.data)) {
                                    throw error;
                                }

                                return body.data;
                            });
                    });
            },

            reportLoadError: function (part, error) {
                if (window.console && window.console.error) {
                    window.console.error('[Dmx4allFooterTool] ' + part, error);
                }

                this.createNotificationError({
                    message: this.$tc('dmx4all-footer-tool.builder.loadError')
                        + this.$tc('dmx4all-footer-tool.builder.loadPart.' + part)
                        + ' (' + errorMessage(error) + ')'
                });
            },

            loadRecords: function () {
                var that = this;
                var criteria = new Shopware.Data.Criteria(1, 500);

                return this.layoutRepository.search(criteria, Shopware.Context.api)
                    .then(function (result) {
                        that.records = Array.from(result);

                        return that.records;
                    });
            },

            /* Anordnung: globale Werte und die des gewaehlten Verkaufskanals */
            loadConfig: function () {
                var that = this;
                var salesChannelId = this.salesChannelId || null;

                if (!this.systemConfigApiService) {
                    return Promise.resolve();
                }

                this.isConfigLoading = true;

                return Promise.all([
                    this.systemConfigApiService.getValues(CONFIG_DOMAIN, null),
                    salesChannelId
                        ? this.systemConfigApiService.getValues(CONFIG_DOMAIN, salesChannelId)
                        : Promise.resolve({})
                ])
                    .then(function (results) {
                        that.legacyConfig = Object.assign({}, results[0] || {}, salesChannelId ? (results[1] || {}) : {});
                        that.globalConfig = pickConfig(results[0]);
                        that.channelConfig = salesChannelId ? pickConfig(results[1]) : {};
                        that.config = Object.assign({}, that.inheritedConfig, that.channelConfig);
                        that.configSnapshot = JSON.stringify(that.config);
                        that.forceConfigSave = false;
                        that.ensureCoreEntries();
                    })
                    .catch(function (error) {
                        that.createNotificationError({
                            message: that.$tc('dmx4all-footer-tool.builder.loadError') + errorMessage(error)
                        });
                    })
                    .finally(function () {
                        that.isConfigLoading = false;
                    });
            },

            setConfig: function (key, value) {
                if (key.indexOf('columns') === 0) {
                    value = clampColumns(value, CONFIG_DEFAULTS[key]);
                }

                var next = Object.assign({}, this.config);
                next[key] = value;
                this.config = next;
            },

            onResetConfig: function () {
                this.config = Object.assign({}, this.inheritedConfig);
                this.channelConfig = {};
                this.forceConfigSave = true;
            },

            /*
             * Fuer "Alle" alle Werte speichern. Fuer einen Verkaufskanal nur
             * die Abweichungen, alles andere auf null: dann erbt er weiter.
             */
            saveConfig: function () {
                var that = this;
                var salesChannelId = this.salesChannelId || null;
                var inherited = this.inheritedConfig;
                var values = {};

                if (!this.configDirty) {
                    return Promise.resolve();
                }

                CONFIG_KEYS.forEach(function (key) {
                    var value = that.config[key];

                    if (salesChannelId && value === inherited[key]) {
                        value = null;
                    }

                    values[configKey(key)] = value;
                });

                var sent = JSON.stringify(this.config);

                return this.systemConfigApiService.saveValues(values, salesChannelId)
                    .then(function () {
                        var current = Object.assign({}, that.config);

                        return that.loadConfig().then(function () {
                            if (JSON.stringify(current) !== sent) {
                                that.config = current;
                            }
                        });
                    });
            },

            /* Layout der aktuellen Auswahl in den Editor laden */
            applyRecord: function () {
                var record = this.record;

                if (record) {
                    this.layoutName = record.name || '';
                    this.layoutActive = !!record.active;
                    this.channelIds = entryChannels(record);
                    this.languageIds = entryLanguages(record);
                    this.syncScopeFields();
                }

                this.layout = normalizeLayout(record ? record.layout : null);
                this.ensureCoreEntries();
                this.isDirty = false;
                this.loadMedia();
            },

            loadMedia: function () {
                var that = this;
                var ids = [];

                this.layout.areas.forEach(function (area) {
                    area.items.forEach(function (item) {
                        if (item.type === 'image' && item.mediaId && !that.mediaMap[item.mediaId]) {
                            ids.push(item.mediaId);
                        }
                    });
                });

                if (!ids.length) {
                    return Promise.resolve();
                }

                var criteria = new Shopware.Data.Criteria(1, ids.length);
                criteria.setIds(ids);

                return this.mediaRepository.search(criteria, Shopware.Context.api)
                    .then(function (result) {
                        var map = Object.assign({}, that.mediaMap);

                        Array.from(result).forEach(function (media) {
                            map[media.id] = media;
                        });

                        that.mediaMap = map;
                    })
                    .catch(function () {
                        /* Vorschau ist nur Komfort, Fehler hier nicht melden */
                    });
            },

            /* -------------------------------------------------------------- */
            /* Beschriftungen                                                 */
            /* -------------------------------------------------------------- */

            channelName: function (id) {
                var channel = this.salesChannels.find(function (entry) { return entry.id === id; });

                if (!channel) {
                    return id;
                }

                return (channel.translated && channel.translated.name) || channel.name || id;
            },

            languageName: function (id) {
                var language = this.languages.find(function (entry) { return entry.id === id; });

                return language ? language.name : id;
            },

            /* Bereich als Text: Listen oder einzelne IDs, leer = Alle */
            scopeLabel: function (channels, languages) {
                var that = this;
                var all = this.$tc('dmx4all-footer-tool.builder.all');
                var list = function (value) {
                    return Array.isArray(value) ? value : (value ? [value] : []);
                };
                var channelList = list(channels);
                var languageList = list(languages);

                var channelLabel = function (id) {
                    return that.unknownIds([id], 'channel').length ? that.$tc('dmx4all-footer-tool.layouts.deletedChannel') : that.channelName(id);
                };
                var languageLabel = function (id) {
                    return that.unknownIds([id], 'language').length ? that.$tc('dmx4all-footer-tool.layouts.deletedLanguage') : that.languageName(id);
                };

                return (channelList.length ? channelList.map(channelLabel).join(', ') : all)
                    + ' / '
                    + (languageList.length ? languageList.map(languageLabel).join(', ') : all);
            },

            /* Liste der IDs, die es hier (nicht mehr) gibt - erst wenn geladen */
            unknownIds: function (ids, kind) {
                var known = kind === 'channel' ? this.salesChannels : this.languages;

                if (!known.length) {
                    return [];
                }

                var knownIds = known.map(function (item) { return item.id; });

                return (ids || []).filter(function (id) { return knownIds.indexOf(id) === -1; });
            },

            /*
             * '' = alles in Ordnung, 'some' = einzelne geloeschte Eintraege,
             * 'nowhere' = eine Liste enthaelt nur noch geloeschte Eintraege:
             * das Layout wirkt dann im Shop nirgends.
             */
            scopeProblem: function (channels, languages) {
                var unknownChannels = this.unknownIds(channels, 'channel');
                var unknownLanguages = this.unknownIds(languages, 'language');

                if ((channels.length && unknownChannels.length === channels.length)
                    || (languages.length && unknownLanguages.length === languages.length)) {
                    return 'nowhere';
                }

                return unknownChannels.length || unknownLanguages.length ? 'some' : '';
            },

            entryChannels: function (entry) {
                return entryChannels(entry);
            },

            entryLanguages: function (entry) {
                return entryLanguages(entry);
            },

            onRemoveDeletedScope: function () {
                var that = this;
                var channels = this.channelIds.filter(function (id) { return that.unknownIds([id], 'channel').length === 0; });
                var languages = this.languageIds.filter(function (id) { return that.unknownIds([id], 'language').length === 0; });

                return this.applyScopeLists(channels, languages);
            },

            hasVisibleItems: function (entry) {
                var that = this;

                return (entry.items || []).some(function (item) { return !that.isEmptyItem(item); });
            },

            entryScopeLabel: function (entry) {
                return this.scopeLabel(entryChannels(entry), entryLanguages(entry));
            },

            mediaUrl: function (mediaId) {
                var media = mediaId ? this.mediaMap[mediaId] : null;

                if (!media) {
                    return null;
                }

                /* Kleinstes Vorschaubild nehmen, falls vorhanden */
                if (media.thumbnails && media.thumbnails.length) {
                    var sorted = Array.from(media.thumbnails).sort(function (a, b) {
                        return a.width - b.width;
                    });

                    return sorted[0].url || media.url;
                }

                return media.url;
            },

            translatedValue: function (map, languageId) {
                map = map || {};

                if (map[languageId]) {
                    return map[languageId];
                }

                if (map[this.systemLanguage]) {
                    return map[this.systemLanguage];
                }

                var keys = Object.keys(map).filter(function (key) { return !!map[key]; });

                return keys.length ? map[keys[0]] : '';
            },

            hasTranslation: function (item, languageId) {
                if (item.type === 'text') {
                    var value = (item.content || {})[languageId] || '';

                    return plainText(value) !== '' || /<img/i.test(value);
                }

                return !!String((item.alt || {})[languageId] || '').trim();
            },

            /*
             * Sprachen ohne eigenen Text. Nur fuer Texte relevant - beim Bild
             * faellt ein leerer Alt-Text auf die Medienverwaltung zurueck.
             */
            missingLanguages: function (item) {
                var that = this;

                if (item.type !== 'text' || this.languageId) {
                    return [];
                }

                return this.sortedLanguages
                    .filter(function (language) { return !that.hasTranslation(item, language.id); })
                    .map(function (language) { return language.name; });
            },

            sizeLabel: function (item) {
                var auto = this.$tc('dmx4all-footer-tool.size.auto');
                var width = item.width ? item.width + ' ' + (item.widthUnit === '%' ? '%' : 'px') : auto;
                var height = item.height ? item.height + ' px' : auto;

                return width + ' \u00d7 ' + height;
            },

            textPreview: function (item) {
                var text = plainText(this.translatedValue(item.content, this.previewLanguage));

                if (!text) {
                    return this.$tc('dmx4all-footer-tool.builder.emptyText');
                }

                return text.length > 90 ? text.substring(0, 90) + '\u2026' : text;
            },

            /* -------------------------------------------------------------- */
            /* Geltungsbereich                                                */
            /* -------------------------------------------------------------- */

            /*
             * Eigener Bestaetigungsdialog statt window.confirm: Browser wie
             * Firefox bieten an, Dialoge einer Seite dauerhaft zu unterdruecken -
             * danach liefert confirm() stumm "nein" und Knoepfe wirken tot.
             */
            askConfirm: function (message, options) {
                var that = this;

                options = options || {};

                if (this.confirmState) {
                    this.confirmState.resolve(false);
                }

                return new Promise(function (resolve) {
                    that.confirmState = {
                        title: options.title || that.$tc('dmx4all-footer-tool.confirm.title'),
                        message: message,
                        confirmLabel: options.confirmLabel || that.$tc('dmx4all-footer-tool.confirm.yes'),
                        danger: !!options.danger,
                        resolve: resolve
                    };
                });
            },

            onConfirmAnswer: function (answer) {
                var state = this.confirmState;

                this.confirmState = null;

                if (state) {
                    state.resolve(!!answer);
                }
            },

            confirmDiscard: function () {
                if (!this.isDirty && !this.configDirty) {
                    return Promise.resolve(true);
                }

                return this.askConfirm(this.$tc('dmx4all-footer-tool.builder.confirmDiscard'), {
                    confirmLabel: this.$tc('dmx4all-footer-tool.confirm.discard'),
                    danger: true
                });
            },

            /* Entfernte Elemente lassen sich einige Sekunden lang zurueckholen */
            offerUndo: function (message, restore) {
                var that = this;

                this.clearUndo();
                this.undoState = { message: message, restore: restore };
                this.undoTimer = window.setTimeout(function () {
                    that.clearUndo();
                }, 8000);
            },

            onUndo: function () {
                var state = this.undoState;

                this.clearUndo();

                if (state && typeof state.restore === 'function') {
                    state.restore();
                    this.isDirty = true;
                }
            },

            clearUndo: function () {
                if (this.undoTimer) {
                    window.clearTimeout(this.undoTimer);
                }

                this.undoTimer = null;
                this.undoState = null;
            },

            aclCan: function (privilege) {
                if (!this.acl || typeof this.acl.can !== 'function') {
                    return true;
                }

                return this.acl.can(privilege);
            },

            /* -------------------------------------------------------------- */
            /* Export / Import                                                */
            /*                                                                */
            /* Datei: JSON mit format "dmx4all-footer-editor". Enthaelt die   */
            /* Layouts, die Anordnung (globale Einstellungen) und zu jedem    */
            /* Bild dessen URL, damit es in einem anderen Shop neu angelegt   */
            /* werden kann.                                                   */
            /* -------------------------------------------------------------- */

            /* Alle Bild-IDs eines gespeicherten Layouts */
            collectMediaIds: function (layout, target) {
                ((layout && layout.areas) || []).forEach(function (area) {
                    (area.items || []).forEach(function (item) {
                        if (item && item.type === 'image' && item.mediaId) {
                            target[item.mediaId] = true;
                        }
                    });
                });

                return target;
            },

            /* Ein Knopf: bei nur einem Layout sofort, sonst kurz fragen */
            onExportClick: function () {
                if (this.exportAllCount <= 1) {
                    return this.onExport(false);
                }

                this.showExportChoice = true;

                return Promise.resolve();
            },

            onExportChoice: function (all) {
                this.showExportChoice = false;

                return this.onExport(all);
            },

            onExport: function (all) {
                var that = this;
                var layouts = [];

                /* Das gerade bearbeitete Layout immer im aktuellen Stand exportieren */
                var current = {
                    name: String(this.layoutName || '').trim() || this.$tc('dmx4all-footer-tool.layouts.unnamed'),
                    active: !!this.layoutActive,
                    salesChannelIds: this.channelIds.slice(),
                    languageIds: this.languageIds.slice(),
                    layout: this.serializeLayout()
                };

                if (all) {
                    this.records.forEach(function (entry) {
                        if (entry.id === that.currentId) {
                            layouts.push(current);

                            return;
                        }

                        layouts.push({
                            name: entry.name || '',
                            active: !!entry.active,
                            salesChannelIds: entryChannels(entry),
                            languageIds: entryLanguages(entry),
                            layout: clone(entry.layout || { areas: [] })
                        });
                    });

                    if (!this.currentId) {
                        layouts.push(current);
                    }
                } else {
                    layouts.push(current);
                }

                var ids = {};

                layouts.forEach(function (entry) {
                    that.collectMediaIds(entry.layout, ids);
                });

                this.isTransferring = true;

                return this.exportMediaInfo(Object.keys(ids))
                    .then(function (media) {
                        var data = {
                            format: 'dmx4all-footer-editor',
                            formatVersion: 1,
                            pluginVersion: PLUGIN_VERSION,
                            exportedAt: new Date().toISOString(),
                            config: Object.assign({}, CONFIG_DEFAULTS, that.globalConfig),
                            salesChannels: that.salesChannels.map(function (channel) {
                                return { id: channel.id, name: that.channelName(channel.id) };
                            }),
                            languages: that.languages.map(function (language) {
                                return { id: language.id, name: language.name };
                            }),
                            media: media,
                            layouts: layouts
                        };

                        var slug = all ? 'alle' : String(current.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                        var date = new Date().toISOString().substring(0, 10);

                        that.downloadJson(data, 'footer-editor-' + (slug || 'layout') + '-' + date + '.json');
                        that.createNotificationSuccess({
                            message: that.tr('dmx4all-footer-tool.transfer.exportDone', { count: layouts.length })
                        });
                    })
                    .catch(function (error) {
                        that.createNotificationError({
                            message: that.$tc('dmx4all-footer-tool.transfer.exportError') + errorMessage(error)
                        });
                    })
                    .finally(function () {
                        that.isTransferring = false;
                    });
            },

            /* URL, Dateiname und Endung je Bild - fuer den Import in anderen Shops */
            exportMediaInfo: function (ids) {
                if (!ids.length) {
                    return Promise.resolve({});
                }

                var criteria = new Shopware.Data.Criteria(1, ids.length);
                criteria.setIds(ids);

                return this.searchWithFallback('media', criteria, ['id', 'url', 'fileName', 'fileExtension', 'alt', 'title'])
                    .then(function (result) {
                        var map = {};

                        result.forEach(function (media) {
                            map[media.id] = {
                                url: media.url || '',
                                fileName: media.fileName || '',
                                fileExtension: media.fileExtension || '',
                                alt: media.alt || '',
                                title: media.title || ''
                            };
                        });

                        return map;
                    })
                    .catch(function () {
                        return {};
                    });
            },

            downloadJson: function (data, fileName) {
                var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                var url = window.URL.createObjectURL(blob);
                var link = document.createElement('a');

                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                window.setTimeout(function () {
                    window.URL.revokeObjectURL(url);
                }, 1000);
            },

            onImportClick: function () {
                if (!this.canCreate) {
                    return;
                }

                var input = this.$refs.importFile;

                if (input) {
                    input.value = '';
                    input.click();
                }
            },

            onImportFile: function (event) {
                var that = this;
                var file = event.target.files && event.target.files[0];

                if (!file) {
                    return;
                }

                var reader = new FileReader();

                reader.onload = function () {
                    var data = null;

                    try {
                        data = JSON.parse(String(reader.result || ''));
                    } catch (error) {
                        data = null;
                    }

                    if (!data || data.format !== 'dmx4all-footer-editor' || !Array.isArray(data.layouts) || !data.layouts.length) {
                        that.createNotificationError({
                            message: that.$tc('dmx4all-footer-tool.transfer.invalidFile')
                        });

                        return;
                    }

                    that.importState = {
                        fileName: file.name,
                        data: data,
                        config: data.config && typeof data.config === 'object' ? data.config : null,
                        applyConfig: false,
                        layouts: data.layouts.map(function (entry) {
                            return Object.assign({ selected: true }, entry);
                        })
                    };
                };

                reader.onerror = function () {
                    that.createNotificationError({
                        message: that.$tc('dmx4all-footer-tool.transfer.invalidFile')
                    });
                };

                reader.readAsText(file);
            },

            /* Bereich anzeigen: Namen aus der Datei, falls die IDs hier unbekannt sind */
            importScopeLabel: function (entry) {
                var that = this;
                var data = this.importState ? this.importState.data : {};
                var all = this.$tc('dmx4all-footer-tool.builder.all');
                var describe = function (ids, known, fileList, nameOf) {
                    if (!ids.length) {
                        return all;
                    }

                    return ids.map(function (id) {
                        if (known.indexOf(id) !== -1) {
                            return nameOf(id);
                        }

                        var fromFile = (fileList || []).find(function (item) { return item.id === id; });

                        return that.tr('dmx4all-footer-tool.transfer.unknownScope', { name: fromFile ? fromFile.name : id });
                    }).join(', ');
                };

                return describe(entryChannels(entry), this.salesChannels.map(function (c) { return c.id; }), data.salesChannels, this.channelName)
                    + ' / '
                    + describe(entryLanguages(entry), this.languages.map(function (l) { return l.id; }), data.languages, this.languageName);
            },

            /*
             * Import: Layouts werden immer als NEUE, INAKTIVE Layouts angelegt.
             * Unbekannte Verkaufskanaele/Sprachen werden zu "Alle". Bilder, die
             * es hier nicht gibt, werden ueber ihre URL neu angelegt; klappt das
             * nicht, bleibt das Bild-Element leer und wird gemeldet.
             */
            onImportConfirm: function () {
                var that = this;
                var state = this.importState;

                if (!state) {
                    return Promise.resolve();
                }

                var selected = state.layouts.filter(function (entry) { return entry.selected; });
                var ids = {};

                selected.forEach(function (entry) {
                    that.collectMediaIds(entry.layout, ids);
                });

                this.isTransferring = true;

                return this.leaveCurrentLayout()
                    .then(function (ok) {
                        if (!ok) {
                            throw new Error('cancelled');
                        }

                        return that.importMedia(Object.keys(ids), state.data.media || {});
                    })
                    .then(function (mediaResult) {
                        var existingNames = that.records.map(function (entry) { return entry.name; });
                        var channelIds = that.salesChannels.map(function (c) { return c.id; });
                        var languageIds = that.languages.map(function (l) { return l.id; });
                        var saved = [];

                        var chain = Promise.resolve();

                        selected.forEach(function (entry) {
                            chain = chain.then(function () {
                                var layout = that.remapMedia(clone(entry.layout || { areas: [] }), mediaResult.map);
                                var name = String(entry.name || '').trim() || that.$tc('dmx4all-footer-tool.layouts.unnamed');

                                if (existingNames.indexOf(name) !== -1) {
                                    name = that.tr('dmx4all-footer-tool.transfer.importedName', { name: name });
                                }

                                existingNames.push(name);

                                var record = that.layoutRepository.create(Shopware.Context.api);
                                record.name = name;
                                record.active = false;
                                /* Nur hier bekannte IDs behalten; bleibt nichts uebrig, gilt "Alle" */
                                var channels = entryChannels(entry).filter(function (id) { return channelIds.indexOf(id) !== -1; });
                                var languages = entryLanguages(entry).filter(function (id) { return languageIds.indexOf(id) !== -1; });

                                record.salesChannelIds = channels.length ? channels : null;
                                record.languageIds = languages.length ? languages : null;
                                record.salesChannelId = channels.length === 1 ? channels[0] : null;
                                record.languageId = languages.length === 1 ? languages[0] : null;
                                record.layout = layout;

                                return that.layoutRepository.save(record, Shopware.Context.api).then(function () {
                                    saved.push(record);
                                });
                            });
                        });

                        return chain.then(function () {
                            return { saved: saved, missing: mediaResult.missing };
                        });
                    })
                    .then(function (result) {
                        if (state.applyConfig && state.config) {
                            var values = {};

                            CONFIG_KEYS.forEach(function (key) {
                                if (state.config[key] !== undefined) {
                                    values[configKey(key)] = state.config[key];
                                }
                            });

                            return that.systemConfigApiService.saveValues(values, null).then(function () {
                                return result;
                            });
                        }

                        return result;
                    })
                    .then(function (result) {
                        return that.loadRecords().then(function () {
                            return that.loadConfig();
                        }).then(function () {
                            return result;
                        });
                    })
                    .then(function (result) {
                        that.importState = null;

                        if (result.saved.length) {
                            var channelBefore = that.salesChannelId;

                            that.currentId = result.saved[0].id;
                            that.applyRecord();
                            that.afterScopeChange(channelBefore);
                        }

                        that.createNotificationSuccess({
                            message: that.tr('dmx4all-footer-tool.transfer.importDone', { count: result.saved.length })
                        });

                        if (result.missing > 0) {
                            that.createNotificationWarning({
                                message: that.tr('dmx4all-footer-tool.transfer.mediaMissing', { count: result.missing })
                            });
                        }

                        return that.clearShopCache();
                    })
                    .catch(function (error) {
                        if (error && error.message === 'cancelled') {
                            return;
                        }

                        that.createNotificationError({
                            message: that.$tc('dmx4all-footer-tool.transfer.importError') + errorMessage(error)
                        });
                    })
                    .finally(function () {
                        that.isTransferring = false;
                    });
            },

            /* Bilder: vorhandene behalten, fehlende per URL neu anlegen */
            importMedia: function (ids, mediaInfo) {
                var that = this;
                var map = {};
                var missing = 0;

                if (!ids.length) {
                    return Promise.resolve({ map: map, missing: 0 });
                }

                var criteria = new Shopware.Data.Criteria(1, ids.length);
                criteria.setIds(ids);

                return this.searchWithFallback('media', criteria, ['id'])
                    .catch(function () {
                        return [];
                    })
                    .then(function (existing) {
                        var existingIds = existing.map(function (media) { return media.id; });
                        var chain = Promise.resolve();

                        ids.forEach(function (id) {
                            if (existingIds.indexOf(id) !== -1) {
                                map[id] = id;

                                return;
                            }

                            var info = mediaInfo[id];

                            if (!info || !info.url) {
                                map[id] = null;
                                missing += 1;

                                return;
                            }

                            chain = chain.then(function () {
                                return that.uploadMediaFromUrl(info)
                                    .then(function (newId) {
                                        map[id] = newId;
                                    })
                                    .catch(function () {
                                        map[id] = null;
                                        missing += 1;
                                    });
                            });
                        });

                        return chain.then(function () {
                            return { map: map, missing: missing };
                        });
                    });
            },

            uploadMediaFromUrl: function (info) {
                var repository = this.mediaRepository;
                var media = repository.create(Shopware.Context.api);
                var extension = (info.fileExtension || String(info.url).split('?')[0].split('.').pop() || 'jpg').toLowerCase();
                var baseName = (info.fileName || 'footer-bild').replace(/[^a-zA-Z0-9_-]+/g, '-');
                /* Eindeutiger Dateiname, sonst lehnt Shopware doppelte Namen ab */
                var fileName = baseName + '-import-' + Date.now().toString(36);

                if (info.alt) {
                    media.alt = info.alt;
                }

                if (info.title) {
                    media.title = info.title;
                }

                return repository.save(media, Shopware.Context.api).then(function () {
                    var headers = repository.buildHeaders(Shopware.Context.api);
                    var url = '/_action/media/' + media.id + '/upload?extension=' + encodeURIComponent(extension)
                        + '&fileName=' + encodeURIComponent(fileName);

                    return repository.httpClient.post(url, { url: info.url }, { headers: headers })
                        .then(function () {
                            return media.id;
                        })
                        .catch(function (error) {
                            /* Leeren Medien-Eintrag wieder entfernen */
                            return repository.delete(media.id, Shopware.Context.api).catch(function () {}).then(function () {
                                throw error;
                            });
                        });
                });
            },

            /* Bild-IDs im Layout auf die hier gueltigen IDs umstellen */
            remapMedia: function (layout, map) {
                ((layout && layout.areas) || []).forEach(function (area) {
                    (area.items || []).forEach(function (item) {
                        if (item && item.type === 'image' && item.mediaId && Object.prototype.hasOwnProperty.call(map, item.mediaId)) {
                            item.mediaId = map[item.mediaId];
                        }
                    });
                });

                return layout;
            },

            /* -------------------------------------------------------------- */
            /* Mehrere Layouts                                                */
            /* -------------------------------------------------------------- */

            /* Beim ersten Laden: Standard-Layout, sonst ein aktives, sonst das erste */
            pickInitialLayout: function () {
                var records = this.records;
                var initial = records.find(function (entry) { return entry.active && !entryChannels(entry).length && !entryLanguages(entry).length; })
                    || records.find(function (entry) { return entry.active; })
                    || records[0]
                    || null;

                if (initial) {
                    this.currentId = initial.id;
                    this.applyRecord();

                    return;
                }

                /* Noch gar kein Layout: ein aktives "Standard" vorbereiten */
                this.currentId = null;
                this.layoutName = this.$tc('dmx4all-footer-tool.layouts.defaultName');
                this.layoutActive = true;
                this.channelIds = [];
                this.languageIds = [];
                this.syncScopeFields();
                this.applyRecord();
            },

            /* Vor dem Wechsel: offene Aenderungen sichern (Autosave an) oder verwerfen lassen */
            leaveCurrentLayout: function () {
                if (!this.isDirty && !this.configDirty) {
                    return Promise.resolve(true);
                }

                if (this.autosaveDelay > 0) {
                    return this.onSave({ auto: true }).then(function () {
                        return true;
                    });
                }

                return this.confirmDiscard();
            },

            onSelectLayout: function (entry) {
                var that = this;

                if (entry.id === this.currentId) {
                    return Promise.resolve();
                }

                return this.leaveCurrentLayout().then(function (ok) {
                    if (!ok) {
                        return;
                    }

                    var channelBefore = that.salesChannelId;

                    that.currentId = entry.id;
                    that.applyRecord();
                    that.afterScopeChange(channelBefore);
                });
            },

            onNewLayout: function () {
                var that = this;

                if (!this.canCreate) {
                    return Promise.resolve();
                }

                return this.leaveCurrentLayout().then(function (ok) {
                    if (!ok) {
                        return;
                    }

                    that.currentId = null;
                    that.layoutName = that.tr('dmx4all-footer-tool.layouts.newName', { number: that.records.length + 1 });
                    /* Neue Layouts sind zunaechst inaktiv, damit sich der Shop nicht ungewollt aendert */
                    that.layoutActive = that.records.length === 0;
                    that.layout = emptyLayout();
                    that.ensureCoreEntries();
                    that.isDirty = true;
                });
            },

            onDuplicateLayout: function () {
                var that = this;

                if (!this.canCreate) {
                    return Promise.resolve();
                }

                if (!this.currentId) {
                    return Promise.resolve();
                }

                return this.leaveCurrentLayout().then(function (ok) {
                    if (!ok) {
                        return;
                    }

                    var copy = normalizeLayout(that.serializeLayout());

                    /* Neue IDs, damit beide Layouts unabhaengig bleiben */
                    copy.areas.forEach(function (area) {
                        area.id = createId();
                        area.items.forEach(function (item) {
                            item.id = createId();
                        });
                    });

                    that.currentId = null;
                    that.layoutName = that.tr('dmx4all-footer-tool.layouts.copyName', { name: that.layoutName });
                    that.layoutActive = false;
                    that.layout = copy;
                    that.ensureCoreEntries();
                    that.isDirty = true;
                    that.loadMedia();
                });
            },

            onLayoutNameInput: function (value) {
                this.layoutName = value;
                this.isDirty = true;
            },

            onLayoutActive: function (active) {
                if (this.layoutActive === active) {
                    return;
                }

                this.layoutActive = active;
                this.isDirty = true;
            },

            /* Abgeleitete Einzelwerte: nur bei genau einem Kanal / einer Sprache */
            syncScopeFields: function () {
                this.salesChannelId = this.channelIds.length === 1 ? this.channelIds[0] : '';
                this.languageId = this.languageIds.length === 1 ? this.languageIds[0] : '';
            },

            onScopeAll: function (kind) {
                return this.applyScopeLists(kind === 'channel' ? [] : this.channelIds, kind === 'language' ? [] : this.languageIds);
            },

            onScopeToggle: function (kind, id) {
                var list = (kind === 'channel' ? this.channelIds : this.languageIds).slice();
                var index = list.indexOf(id);

                if (index === -1) {
                    list.push(id);
                } else {
                    list.splice(index, 1);
                }

                return kind === 'channel'
                    ? this.applyScopeLists(list, this.languageIds)
                    : this.applyScopeLists(this.channelIds, list);
            },

            applyScopeLists: function (channels, languages) {
                var that = this;
                var newChannel = channels.length === 1 ? channels[0] : '';
                var apply = function () {
                    var channelBefore = that.salesChannelId;

                    that.channelIds = channels.slice();
                    that.languageIds = languages.slice();
                    that.syncScopeFields();
                    that.isDirty = true;
                    that.afterScopeChange(channelBefore);
                };

                /* Anordnung gilt je Verkaufskanal: ungespeicherte Anordnung vorher klaeren */
                if (newChannel !== (this.salesChannelId || '') && this.configDirty) {
                    return this.confirmDiscard().then(function (ok) {
                        if (ok) {
                            apply();
                        }
                    });
                }

                apply();

                return Promise.resolve();
            },

            afterScopeChange: function (channelBefore) {
                if ((channelBefore || '') !== (this.salesChannelId || '')) {
                    this.loadConfig();
                    this.loadNavCategories();
                }
            },

            /* -------------------------------------------------------------- */
            /* Drag and Drop                                                  */
            /* -------------------------------------------------------------- */

            /*
             * Ziehen per Pointer-Events statt HTML5-Drag-and-Drop.
             *
             * Das native Drag and Drop wird in der Administration von
             * anderen Komponenten abgefangen bzw. abgebrochen. Mit
             * pointerdown / pointermove / pointerup liegt der ganze Ablauf
             * in unserer Hand und funktioniert auch mit Touch.
             *
             * Ablauf: erst nach 5 px Bewegung beginnt das Ziehen (Klick und
             * Doppelklick bleiben also erhalten). Ein Abbild des Elements
             * folgt dem Zeiger, das Original bleibt halb sichtbar stehen.
             */
            onPointerDown: function (event, payload) {
                if (event.button !== undefined && event.button !== 0) {
                    return;
                }

                /* Bearbeiten- und Loeschen-Knoepfe nicht als Ziehen werten */
                if (event.target && event.target.closest && event.target.closest('button')) {
                    return;
                }

                /*
                 * Verhindert Textauswahl und den eingebauten Browser-Drag, der
                 * sonst die Pointer-Events mit pointercancel beendet.
                 * Klick und Doppelklick loest der Browser trotzdem aus.
                 */
                if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
                    event.preventDefault();
                }

                this.endPointerDrag(false);

                var source = event.currentTarget;

                POINTER = {
                    payload: payload,
                    source: source,
                    startX: event.clientX,
                    startY: event.clientY,
                    offsetX: 0,
                    offsetY: 0,
                    started: false,
                    ghost: null,
                    scroller: null,
                    scrollTimer: null,
                    scrollArmed: false,
                    lastX: event.clientX,
                    lastY: event.clientY,
                    move: this.onPointerMove.bind(this),
                    up: this.onPointerUp.bind(this),
                    key: this.onPointerKey.bind(this)
                };

                window.addEventListener('pointermove', POINTER.move, true);
                window.addEventListener('pointerup', POINTER.up, true);
                window.addEventListener('pointercancel', POINTER.up, true);
                window.addEventListener('keydown', POINTER.key, true);
            },

            onPointerMove: function (event) {
                var state = POINTER;

                if (!state) {
                    return;
                }

                state.lastX = event.clientX;
                state.lastY = event.clientY;

                if (!state.started) {
                    var dx = event.clientX - state.startX;
                    var dy = event.clientY - state.startY;

                    if ((dx * dx) + (dy * dy) < 25) {
                        return;
                    }

                    this.beginPointerDrag(state);
                }

                event.preventDefault();

                state.ghost.style.left = (event.clientX - state.offsetX) + 'px';
                state.ghost.style.top = (event.clientY - state.offsetY) + 'px';

                this.updateDropTarget(event.clientX, event.clientY);
                this.autoScroll(state);
            },

            /*
             * Das Abbild am Zeiger ist ein kleines Schild mit der Bezeichnung,
             * kein Klon der ganzen Kachel. Es sitzt rechts unterhalb des
             * Zeigers, damit Ziel und Einfuegelinie immer sichtbar bleiben.
             */
            beginPointerDrag: function (state) {
                if (state.payload.source === 'area') {
                    state.source = state.source.closest('.dft-area') || state.source;
                }

                var ghost = document.createElement('div');
                var grip = document.createElement('span');
                var label = document.createElement('span');

                state.started = true;
                state.offsetX = -14;
                state.offsetY = -14;

                grip.className = 'dft-grip';
                label.className = 'dft-ghost__label';
                label.textContent = this.ghostLabel(state.payload);

                ghost.className = 'dft-ghost';
                ghost.appendChild(grip);
                ghost.appendChild(label);
                ghost.style.left = (state.lastX + 14) + 'px';
                ghost.style.top = (state.lastY + 14) + 'px';
                document.body.appendChild(ghost);

                state.ghost = ghost;
                state.scroller = this.findScroller(state.source);

                document.body.classList.add('dft-is-dragging');

                this.drag = state.payload;
            },

            ghostLabel: function (payload) {
                if (payload.source === 'palette') {
                    return this.$tc('dmx4all-footer-tool.builder.' + (payload.type === 'image' ? 'typeImage' : 'typeText'));
                }

                var entry = this.layout.areas[payload.area];

                if (!entry) {
                    return '';
                }

                if (payload.source === 'area') {
                    return this.entryTitle(entry, payload.area);
                }

                var item = entry.items[payload.index];

                if (!item) {
                    return '';
                }

                if (item.type === 'image') {
                    return this.$tc('dmx4all-footer-tool.builder.typeImage');
                }

                return this.textPreview(item);
            },

            /* Den Bereich unter dem Zeiger und die Einfuegeposition bestimmen */
            updateDropTarget: function (x, y) {
                var element = document.elementFromPoint(x, y);

                if (POINTER && POINTER.payload.source === 'area') {
                    this.updateAreaDrop(element, x);

                    return;
                }
                var areaNode = element && element.closest ? element.closest('.dft-area') : null;

                if (!areaNode || !this.$el.contains(areaNode)) {
                    if (this.dropTarget) {
                        this.dropTarget = null;
                    }

                    return;
                }

                if (areaNode.classList.contains('is--locked')) {
                    if (this.dropTarget) {
                        this.dropTarget = null;
                    }

                    return;
                }

                var areaIndex = parseInt(areaNode.getAttribute('data-area-index'), 10);
                var nodes = areaNode.querySelectorAll('.dft-item');
                var index = nodes.length;

                for (var i = 0; i < nodes.length; i += 1) {
                    var rect = nodes[i].getBoundingClientRect();

                    if (y < rect.top + (rect.height / 2)) {
                        index = i;
                        break;
                    }
                }

                if (!this.dropTarget || this.dropTarget.area !== areaIndex || this.dropTarget.index !== index) {
                    this.dropTarget = { area: areaIndex, index: index };
                }
            },

            /* Bereich verschieben: vor oder hinter den Bereich unter dem Zeiger */
            updateAreaDrop: function (element, x) {
                var areaNode = element && element.closest ? element.closest('.dft-area') : null;
                var addNode = element && element.closest ? element.closest('.dft-area-add') : null;
                var index = null;

                if (areaNode && this.$el.contains(areaNode)) {
                    var areaIndex = parseInt(areaNode.getAttribute('data-area-index'), 10);
                    var rect = areaNode.getBoundingClientRect();

                    index = x > rect.left + (rect.width / 2) ? areaIndex + 1 : areaIndex;
                } else if (addNode && this.$el.contains(addNode)) {
                    index = this.layout.areas.length;
                }

                if (this.areaDrop !== index) {
                    this.areaDrop = index;
                }
            },

            /* Scrollbaren Container der Seite finden (Admin scrollt nicht das window) */
            findScroller: function (node) {
                var current = node ? node.parentElement : null;

                while (current && current !== document.body) {
                    var style = window.getComputedStyle(current);

                    if (/(auto|scroll)/.test(style.overflowY) && current.scrollHeight > current.clientHeight) {
                        return current;
                    }

                    current = current.parentElement;
                }

                return document.scrollingElement || document.documentElement;
            },

            /* Am oberen/unteren Rand automatisch weiterscrollen */
            autoScroll: function (state) {
                var that = this;

                if (state.scrollTimer || !state.scroller) {
                    return;
                }

                state.scrollTimer = window.setInterval(function () {
                    if (POINTER !== state || !state.started) {
                        window.clearInterval(state.scrollTimer);
                        state.scrollTimer = null;

                        return;
                    }

                    var box = state.scroller.getBoundingClientRect();
                    var top = Math.max(box.top, 0);
                    var bottom = Math.min(box.bottom, window.innerHeight);
                    var zone = 50;
                    var step = 0;
                    var inTop = state.lastY < top + zone;
                    var inBottom = state.lastY > bottom - zone;

                    /*
                     * Erst scrollen, wenn der Zeiger den Randbereich einmal
                     * verlassen hat. Sonst scrollt die Seite sofort weg, wenn
                     * man ein Element nahe am Rand anfasst (z. B. "Text" oder
                     * "Bild" direkt unter der Kopfleiste) - und das Raster
                     * verschwindet aus dem Blickfeld.
                     */
                    if (!inTop && !inBottom) {
                        state.scrollArmed = true;
                    }

                    if (!state.scrollArmed) {
                        return;
                    }

                    /* Je naeher am Rand, desto schneller */
                    if (inTop) {
                        step = -Math.max(2, Math.round((top + zone - state.lastY) / 3));
                    } else if (inBottom) {
                        step = Math.max(2, Math.round((state.lastY - (bottom - zone)) / 3));
                    }

                    if (step !== 0) {
                        state.scroller.scrollTop += step;
                        that.updateDropTarget(state.lastX, state.lastY);
                    }
                }, 16);
            },

            onPointerUp: function () {
                var state = POINTER;
                var target = this.dropTarget;
                var areaTarget = this.areaDrop;

                this.endPointerDrag(true);

                if (!state || !state.started) {
                    return;
                }

                if (state.payload.source === 'area') {
                    if (areaTarget !== null) {
                        this.moveArea(state.payload.area, areaTarget);
                    }

                    return;
                }

                if (!target) {
                    return;
                }

                var payload = state.payload;

                if (payload.source === 'palette') {
                    this.insertItem(newItem(payload.type), target.area, target.index);

                    return;
                }

                this.moveItem(payload.area, payload.index, target.area, target.index);
            },

            onPointerKey: function (event) {
                if (event.key === 'Escape') {
                    this.endPointerDrag(true);
                }
            },

            endPointerDrag: function () {
                var state = POINTER;

                if (state) {
                    window.removeEventListener('pointermove', state.move, true);
                    window.removeEventListener('pointerup', state.up, true);
                    window.removeEventListener('pointercancel', state.up, true);
                    window.removeEventListener('keydown', state.key, true);

                    if (state.scrollTimer) {
                        window.clearInterval(state.scrollTimer);
                    }

                    if (state.ghost && state.ghost.parentNode) {
                        state.ghost.parentNode.removeChild(state.ghost);
                    }
                }

                POINTER = null;
                document.body.classList.remove('dft-is-dragging');
                this.drag = null;
                this.dropTarget = null;
                this.areaDrop = null;
            },

            moveItem: function (fromArea, fromIndex, toArea, toIndex) {
                var source = this.layout.areas[fromArea].items;
                var target = this.layout.areas[toArea].items;

                if (fromArea === toArea && (toIndex === fromIndex || toIndex === fromIndex + 1)) {
                    return;
                }

                var item = source.splice(fromIndex, 1)[0];

                if (fromArea === toArea && fromIndex < toIndex) {
                    toIndex -= 1;
                }

                target.splice(toIndex, 0, item);
                this.isDirty = true;
            },

            isDropAt: function (areaIndex, index) {
                return !!this.dropTarget && this.dropTarget.area === areaIndex && this.dropTarget.index === index;
            },

            isDragged: function (areaIndex, index) {
                return !!this.drag && this.drag.source === 'item' && this.drag.area === areaIndex && this.drag.index === index;
            },

            /* -------------------------------------------------------------- */
            /* Elemente bearbeiten                                            */
            /* -------------------------------------------------------------- */

            /* -------------------------------------------------------------- */
            /* Standard-Spalten (Service-Hotline, Footer-Navigation)          */
            /* -------------------------------------------------------------- */

            /* Spalten der Footer-Navigation = Unterkategorien der Footer-Kategorie */
            loadNavCategories: function () {
                var that = this;
                var channel = null;

                var preferred = this.salesChannelId || this.channelIds[0] || '';

                if (preferred) {
                    channel = this.salesChannels.find(function (entry) { return entry.id === preferred; });
                } else {
                    channel = this.salesChannels.find(function (entry) { return !!entry.footerCategoryId; });
                }

                if (!channel || !channel.footerCategoryId) {
                    this.navCategories = [];
                    this.ensureCoreEntries();

                    return Promise.resolve();
                }

                var criteria = new Shopware.Data.Criteria(1, 50);
                criteria.addFilter(Shopware.Data.Criteria.equals('parentId', channel.footerCategoryId));

                return this.searchWithFallback('category', criteria, ['id', 'name', 'translated', 'afterCategoryId', 'parentId'])
                    .then(function (result) {
                        that.navCategories = that.sortCategories(result);
                        that.ensureCoreEntries();
                    })
                    .catch(function (error) {
                        if (window.console && window.console.warn) {
                            window.console.warn('[Dmx4allFooterTool] footer categories', error);
                        }

                        that.navCategories = [];
                        that.ensureCoreEntries();
                    });
            },

            /* Reihenfolge wie im Kategoriebaum (afterCategoryId-Kette) */
            sortCategories: function (categories) {
                var byAfter = {};
                var sorted = [];
                var current = null;

                categories.forEach(function (category) {
                    byAfter[category.afterCategoryId || 'first'] = category;
                });

                current = byAfter.first;

                while (current && sorted.length < categories.length) {
                    sorted.push(current);
                    current = byAfter[current.id];
                }

                categories.forEach(function (category) {
                    if (sorted.indexOf(category) === -1) {
                        sorted.push(category);
                    }
                });

                return sorted;
            },

            /*
             * Sorgt dafuer, dass Hotline und alle Navigationsspalten als
             * Eintraege im Layout stehen. Alte Layouts ohne solche Eintraege
             * bekommen sie an der Stelle, die die fruehere Einstellung
             * "Reihenfolge in der Zeile" vorgab. Veraendert nur die Anzeige,
             * markiert das Layout nicht als geaendert.
             */
            ensureCoreEntries: function () {
                var areas = this.layout.areas;
                var legacy = this.legacyConfig || {};
                var hasCore = areas.some(isCore);

                if (!hasCore) {
                    var order = legacy[configKey('inlineOrder')] || 'end';
                    var hotline = newCore('hotline');
                    var nav = newCore('nav');

                    hotline.hidden = legacy[configKey('showHotline')] === false;
                    nav.hidden = legacy[configKey('showNavigation')] === false;

                    if (order === 'start') {
                        areas.push(hotline, nav);
                    } else if (order === 'between') {
                        areas.unshift(hotline);
                        areas.push(nav);
                    } else {
                        areas.unshift(hotline, nav);
                    }
                }

                if (!areas.some(function (entry) { return isCore(entry) && entry.key === 'hotline'; })) {
                    areas.unshift(newCore('hotline'));
                }

                /* Alte Sammel-Eintraege "logos" / "bottom" in Einzelteile aufteilen */
                Object.keys(LEGACY_PARTS).forEach(function (old) {
                    var index = areas.findIndex(function (entry) { return isCore(entry) && entry.key === old; });

                    if (index === -1) {
                        return;
                    }

                    var legacyEntry = areas[index];
                    var parts = LEGACY_PARTS[old];
                    var last = parts.length - 1;
                    var replacement = [];

                    parts.forEach(function (key, partIndex) {
                        if (areas.some(function (entry) { return isCore(entry) && entry.key === key; })) {
                            return;
                        }

                        var part = newCore(key);
                        part.span = legacyEntry.span;
                        part.hidden = legacyEntry.hidden;
                        part.inRow = !!legacyEntry.inRow;
                        part.mode = legacyEntry.mode || 'default';

                        if (part.mode === 'replace') {
                            part.items = partIndex === 0 ? legacyEntry.items : [];
                        } else if (part.mode === 'append') {
                            part.mode = partIndex === last ? 'append' : 'default';
                            part.items = partIndex === last ? legacyEntry.items : [];
                        }

                        replacement.push(part);
                    });

                    Array.prototype.splice.apply(areas, [index, 1].concat(replacement));
                });

                OUTSIDE_KEYS.forEach(function (key) {
                    if (!areas.some(function (entry) { return isCore(entry) && entry.key === key; })) {
                        areas.push(newCore(key));
                    }
                });

                /* Platzhalter 'nav' durch die einzelnen Navigationsspalten ersetzen */
                if (this.navCategories.length) {
                    var wildcard = areas.findIndex(function (entry) { return isCore(entry) && entry.key === 'nav'; });
                    var missing = [];

                    for (var n = 1; n <= this.navCategories.length; n += 1) {
                        var key = 'nav-' + n;

                        if (!areas.some(function (entry) { return isCore(entry) && entry.key === key; })) {
                            var navEntry = newCore(key);

                            if (wildcard !== -1) {
                                navEntry.span = areas[wildcard].span;
                                navEntry.hidden = areas[wildcard].hidden;
                            }

                            missing.push(navEntry);
                        }
                    }

                    if (wildcard !== -1) {
                        Array.prototype.splice.apply(areas, [wildcard, 1].concat(missing));
                    } else if (missing.length) {
                        var last = -1;

                        areas.forEach(function (entry, index) {
                            if (isCore(entry)) {
                                last = index;
                            }
                        });

                        Array.prototype.splice.apply(areas, [last + 1, 0].concat(missing));
                    }
                } else if (!areas.some(function (entry) { return isCore(entry) && entry.key.indexOf('nav') === 0; })) {
                    areas.push(newCore('nav'));
                }
            },

            coreLabel: function (entry) {
                if (entry.key === 'hotline') {
                    return this.$tc('dmx4all-footer-tool.arrangement.previewHotline');
                }

                if (isOutsideKey(entry.key)) {
                    return this.$tc('dmx4all-footer-tool.core.part_' + entry.key);
                }

                var match = /^nav-(\d+)$/.exec(entry.key);

                if (match) {
                    var category = this.navCategories[parseInt(match[1], 10) - 1];

                    if (category) {
                        return (category.translated && category.translated.name) || category.name;
                    }

                    return this.$tc('dmx4all-footer-tool.arrangement.previewNavigation') + ' ' + match[1];
                }

                return this.$tc('dmx4all-footer-tool.arrangement.previewNavigation');
            },

            /* Standard-Spalten nur bei "Neben den Standard-Spalten" im Raster zeigen */
            isOutsideKey: function (key) {
                return isOutsideKey(key);
            },

            isVisibleEntry: function (entry) {
                if (!isCore(entry)) {
                    return true;
                }

                if (!this.isInline || entry.hidden) {
                    return false;
                }

                if (isOutsideKey(entry.key) && !entry.inRow) {
                    return false;
                }

                /* Navigationsspalten, die es im Shop (nicht mehr) gibt, nicht zeigen */
                var match = /^nav-(\d+)$/.exec(entry.key);

                if (match && this.navCategories.length && parseInt(match[1], 10) > this.navCategories.length) {
                    return false;
                }

                return true;
            },

            entryTitle: function (entry, index) {
                if (isCore(entry)) {
                    return this.coreLabel(entry);
                }

                var number = 0;

                for (var i = 0; i <= index; i += 1) {
                    if (!isCore(this.layout.areas[i])) {
                        number += 1;
                    }
                }

                return this.$tc('dmx4all-footer-tool.builder.area') + ' ' + number;
            },

            /* Logos / Fussleiste in die Spaltenzeile holen: ans Ende der Liste */
            onMoveIntoRow: function (entry) {
                var areas = this.layout.areas;
                var index = areas.indexOf(entry);

                if (index !== -1) {
                    areas.splice(index, 1);
                    areas.push(entry);
                }

                entry.inRow = true;
                this.isDirty = true;
            },

            onMoveOutOfRow: function (entry) {
                entry.inRow = false;
                this.isDirty = true;
            },

            onCoreModeChange: function (entry, mode) {
                entry.mode = ['append', 'replace'].indexOf(mode) !== -1 ? mode : 'default';
                this.isDirty = true;
            },

            /* Eigene Ueberschrift gibt es fuer Hotline und Navigationsspalten */
            hasHeadline: function (entry) {
                return isCore(entry) && (entry.key === 'hotline' || entry.key.indexOf('nav') === 0);
            },

            headlinePreview: function (entry) {
                return this.translatedValue(entry.headline, this.previewLanguage);
            },

            onEditHeadline: function (entry) {
                this.headlineEditing = {
                    entry: entry,
                    languageId: this.languageId || this.systemLanguage,
                    values: Object.assign({}, entry.headline || {})
                };
            },

            onHeadlineApply: function () {
                var editing = this.headlineEditing;

                if (!editing) {
                    return;
                }

                editing.entry.headline = cleanTranslated(editing.values, false);
                this.headlineEditing = null;
                this.isDirty = true;
            },

            /* -------------------------------------------------------------- */
            /* Design je Bereich                                              */
            /* -------------------------------------------------------------- */

            hasDesign: function (entry) {
                return Object.keys(normalizeDesign(entry.design)).length > 0;
            },

            designSwatchStyle: function (entry) {
                var d = normalizeDesign(entry.design);
                var style = {};

                if (d.backgroundColor) {
                    style.background = d.backgroundColor;
                }

                if (d.borderColor || d.textColor) {
                    style.borderColor = d.borderColor || d.textColor;
                }

                return style;
            },

            onEditDesign: function (entry, index) {
                var values = {};
                var current = normalizeDesign(entry.design);

                DESIGN_FIELDS.forEach(function (field) {
                    values[field.key] = current[field.key] !== undefined ? String(current[field.key]) : '';
                });

                this.designEditing = {
                    entry: entry,
                    title: this.entryTitle(entry, index),
                    values: values,
                    hover: false,
                    previewHeadingStyle: {}
                };
                this.updateDesignHeading();
            },

            updateDesignHeading: function () {
                if (!this.designEditing) {
                    return;
                }

                var d = normalizeDesign(this.designEditing.values);

                this.designEditing.previewHeadingStyle = d.headingColor ? { color: d.headingColor } : {};
            },

            colorPickerValue: function (value) {
                /* Der Farbwaehler kennt nur #rrggbb */
                if (/^#[0-9a-fA-F]{6}$/.test(value || '')) {
                    return value;
                }

                if (/^#[0-9a-fA-F]{3}$/.test(value || '')) {
                    return '#' + value[1] + value[1] + value[2] + value[2] + value[3] + value[3];
                }

                return '#000000';
            },

            designOptionLabel: function (key, option) {
                if (key === 'fontWeight') {
                    return option + ' – ' + this.$tc('dmx4all-footer-tool.design.weight_' + option);
                }

                return this.$tc('dmx4all-footer-tool.design.option_' + option);
            },

            onDesignReset: function () {
                var values = this.designEditing ? this.designEditing.values : null;

                if (!values) {
                    return;
                }

                Object.keys(values).forEach(function (key) {
                    values[key] = '';
                });
            },

            onDesignApply: function () {
                var editing = this.designEditing;

                if (!editing) {
                    return;
                }

                editing.entry.design = normalizeDesign(editing.values);
                this.designEditing = null;
                this.isDirty = true;
            },

            onHideCore: function (entry) {
                entry.hidden = true;
                this.isDirty = true;
            },

            onShowCore: function (entry) {
                entry.hidden = false;
                this.isDirty = true;
            },

            /* Naechster sichtbarer Nachbar in Richtung direction */
            neighbourIndex: function (areaIndex, direction) {
                for (var i = areaIndex + direction; i >= 0 && i < this.layout.areas.length; i += direction) {
                    if (this.isVisibleEntry(this.layout.areas[i])) {
                        return i;
                    }
                }

                return -1;
            },

            canMove: function (areaIndex, direction) {
                return this.neighbourIndex(areaIndex, direction) !== -1;
            },

            /* Ein Element so aufbereiten, wie die Vorschau es zeigt */
            previewEntry: function (item) {
                if (item.type === 'image') {
                    return {
                        src: this.mediaUrl(item.mediaId),
                        align: item.align || 'left',
                        style: this.previewImageStyle(item),
                        placeholder: this.$tc('dmx4all-footer-tool.builder.typeImage')
                    };
                }

                var text = plainText(this.translatedValue(item.content, this.previewLanguage));

                return {
                    text: text.length > 80 ? text.substring(0, 80) + '\u2026' : text,
                    placeholder: this.$tc('dmx4all-footer-tool.builder.typeText')
                };
            },

            /* Vorschau ist verkleinert: Pixel grob auf ein Viertel, Prozent bleiben */
            previewImageStyle: function (item) {
                var style = {};

                if (item.width) {
                    style.width = item.widthUnit === '%' ? item.width + '%' : Math.max(12, Math.round(item.width / 4)) + 'px';
                }

                if (item.height) {
                    style.height = Math.max(12, Math.round(item.height / 4)) + 'px';
                    style.maxHeight = 'none';
                    style.objectFit = 'contain';
                }

                return style;
            },

            areaGridColumn: function (area) {
                if (area.span === 'full') {
                    return '1 / -1';
                }

                return 'span ' + Math.min(normalizeSpan(area.span), this.adminColumns);
            },

            spanOptions: function (area) {
                var options = [];
                var max = Math.max(this.adminColumns, area.span === 'full' ? 1 : normalizeSpan(area.span));

                for (var i = 1; i <= max; i += 1) {
                    options.push({
                        value: String(i),
                        label: i === 1
                            ? this.$tc('dmx4all-footer-tool.builder.spanColumn')
                            : this.tr('dmx4all-footer-tool.builder.spanColumns', { count: i })
                    });
                }

                options.push({ value: 'full', label: this.$tc('dmx4all-footer-tool.builder.spanFull') });

                return options;
            },

            onSpanChange: function (area, value) {
                area.span = normalizeSpan(value);
                this.isDirty = true;
            },

            isAreaDragged: function (areaIndex) {
                return !!this.drag && this.drag.source === 'area' && this.drag.area === areaIndex;
            },

            onAddArea: function () {
                if (this.ownAreaCount >= MAX_AREAS) {
                    return;
                }

                this.layout.areas.push(newArea());
                this.isDirty = true;
            },

            onRemoveArea: function (areaIndex) {
                var area = this.layout.areas[areaIndex];

                if (!area || isCore(area) || this.ownAreaCount <= 1) {
                    return;
                }

                var that = this;
                var remove = function () {
                    var index = that.layout.areas.indexOf(area);

                    if (index === -1) {
                        return;
                    }

                    that.layout.areas.splice(index, 1);
                    that.isDirty = true;
                    that.offerUndo(that.$tc('dmx4all-footer-tool.undo.areaRemoved'), function () {
                        that.layout.areas.splice(Math.min(index, that.layout.areas.length), 0, area);
                    });
                };

                if (!area.items.length) {
                    remove();

                    return Promise.resolve();
                }

                return this.askConfirm(this.$tc('dmx4all-footer-tool.builder.areaRemoveConfirm'), {
                    confirmLabel: this.$tc('dmx4all-footer-tool.builder.areaRemove'),
                    danger: true
                }).then(function (ok) {
                    if (ok) {
                        remove();
                    }
                });
            },

            moveArea: function (fromIndex, toIndex) {
                var areas = this.layout.areas;

                if (toIndex === fromIndex || toIndex === fromIndex + 1) {
                    return;
                }

                var area = areas.splice(fromIndex, 1)[0];

                if (fromIndex < toIndex) {
                    toIndex -= 1;
                }

                areas.splice(toIndex, 0, area);
                this.isDirty = true;
            },

            onMoveArea: function (areaIndex, direction) {
                var target = this.neighbourIndex(areaIndex, direction);
                var areas = this.layout.areas;

                if (target === -1) {
                    return;
                }

                var entry = areas[areaIndex];
                areas.splice(areaIndex, 1, areas[target]);
                areas.splice(target, 1, entry);
                this.isDirty = true;
            },

            onAdd: function (type, areaIndex) {
                this.insertItem(newItem(type), areaIndex, this.layout.areas[areaIndex].items.length);
            },

            /*
             * Neues Element sofort in den Bereich setzen. Befuellt wird es
             * danach per Doppelklick oder Stift - kein Dialog, der die
             * Bereiche verdeckt.
             */
            insertItem: function (item, areaIndex, index) {
                this.layout.areas[areaIndex].items.splice(index, 0, item);
                this.isDirty = true;
            },

            isEmptyItem: function (item) {
                if (item.type === 'image') {
                    return !item.mediaId;
                }

                return !Object.keys(cleanTranslated(item.content, true)).length;
            },

            onEdit: function (areaIndex, itemIndex) {
                this.openEditor(clone(this.layout.areas[areaIndex].items[itemIndex]), areaIndex, itemIndex, false);
            },

            openEditor: function (item, areaIndex, itemIndex, isNew) {
                this.editing = {
                    item: item,
                    area: areaIndex,
                    index: itemIndex,
                    isNew: isNew,
                    languageId: this.languageId || this.systemLanguage,
                    width: item.width ? String(item.width) : '',
                    widthUnit: item.widthUnit === '%' ? '%' : 'px',
                    height: item.height ? String(item.height) : ''
                };
            },

            onTextChange: function (value) {
                if (this.editing) {
                    var content = Object.assign({}, this.editing.item.content);
                    content[this.editing.languageId] = value;
                    this.editing.item.content = content;
                }
            },

            onUploadFinish: function (payload) {
                if (!this.editing || !payload || !payload.targetId) {
                    return;
                }

                this.setEditingMedia(payload.targetId);
            },

            onMediaSelected: function (selection) {
                var media = Array.isArray(selection) ? selection[0] : selection;

                if (media && media.id && this.editing) {
                    this.mediaMap = Object.assign({}, this.mediaMap, (function () {
                        var entry = {};
                        entry[media.id] = media;

                        return entry;
                    })());
                    this.editing.item.mediaId = media.id;
                }

                this.showMediaModal = false;
            },

            onMediaDrop: function (media) {
                if (media && media.id) {
                    this.setEditingMedia(media.id);
                }
            },

            setEditingMedia: function (mediaId) {
                if (!this.editing) {
                    return;
                }

                this.editing.item.mediaId = mediaId;
                this.loadMedia().then(function () {
                    return this.loadSingleMedia(mediaId);
                }.bind(this));
            },

            loadSingleMedia: function (mediaId) {
                var that = this;

                if (this.mediaMap[mediaId]) {
                    return Promise.resolve();
                }

                return this.mediaRepository.get(mediaId, Shopware.Context.api)
                    .then(function (media) {
                        if (media) {
                            var map = Object.assign({}, that.mediaMap);
                            map[media.id] = media;
                            that.mediaMap = map;
                        }
                    })
                    .catch(function () {});
            },

            onRemoveImage: function () {
                if (this.editing) {
                    this.editing.item.mediaId = null;
                }
            },

            onEditCancel: function () {
                this.editing = null;
                this.showMediaModal = false;
            },

            onEditApply: function () {
                var editing = this.editing;

                if (!editing) {
                    return;
                }

                var item = editing.item;

                if (item.type === 'image') {
                    if (!item.mediaId) {
                        this.createNotificationError({
                            message: this.$tc('dmx4all-footer-tool.builder.imageRequired')
                        });

                        return;
                    }

                    var width = parseInt(String(editing.width).replace(/[^0-9]/g, ''), 10);
                    var height = parseInt(String(editing.height).replace(/[^0-9]/g, ''), 10);

                    item.widthUnit = editing.widthUnit === '%' ? '%' : 'px';
                    item.width = width > 0 ? Math.min(width, item.widthUnit === '%' ? 100 : 2000) : null;
                    item.height = height > 0 ? Math.min(height, 2000) : null;
                    delete item.maxWidth;
                    item.alt = cleanTranslated(item.alt, false);
                    item.link = cleanTranslated(item.link, false);
                } else if (!Object.keys(cleanTranslated(item.content, true)).length) {
                    this.createNotificationError({
                        message: this.$tc('dmx4all-footer-tool.builder.textRequired')
                    });

                    return;
                }

                if (item.type === 'text') {
                    item.content = cleanTranslated(item.content, true);
                }

                var items = this.layout.areas[editing.area].items;

                if (editing.isNew) {
                    items.splice(editing.index, 0, item);
                } else {
                    items.splice(editing.index, 1, item);
                }

                this.isDirty = true;
                this.editing = null;
                this.showMediaModal = false;
                this.loadMedia();
            },

            /* Sofort entfernen, dafuer einige Sekunden "Rueckgaengig" anbieten */
            onRemove: function (areaIndex, itemIndex) {
                var that = this;
                var entry = this.layout.areas[areaIndex];

                if (!entry || !entry.items[itemIndex]) {
                    return;
                }

                var item = entry.items.splice(itemIndex, 1)[0];
                this.isDirty = true;

                this.offerUndo(this.$tc('dmx4all-footer-tool.undo.itemRemoved'), function () {
                    entry.items.splice(Math.min(itemIndex, entry.items.length), 0, item);
                });
            },

            /* -------------------------------------------------------------- */
            /* Speichern und Loeschen                                         */
            /* -------------------------------------------------------------- */

            /* Nur die Felder speichern, die die Storefront braucht */
            /* Nur die Felder speichern, die die Storefront braucht */
            serializeItems: function (items) {
                return (items || []).map(function (item) {
                                if (item.type === 'image') {
                                    return {
                                        id: item.id,
                                        type: 'image',
                                        mediaId: item.mediaId,
                                        alt: cleanTranslated(item.alt, false),
                                        link: cleanTranslated(item.link, false),
                                        newTab: !!item.newTab,
                                        width: item.width || null,
                                        widthUnit: item.widthUnit === '%' ? '%' : 'px',
                                        height: item.height || null,
                                        align: item.align || 'left'
                                    };
                                }

                                return { id: item.id, type: 'text', content: cleanTranslated(item.content, true) };
                            });
            },

            serializeLayout: function () {
                var that = this;

                return {
                    areas: this.layout.areas.map(function (area) {
                        if (isCore(area)) {
                            var core = {
                                id: area.id,
                                type: 'core',
                                key: area.key,
                                span: normalizeSpan(area.span),
                                hidden: !!area.hidden,
                                design: normalizeDesign(area.design),
                                mode: area.mode || 'default',
                                headline: cleanTranslated(area.headline, false),
                                items: that.serializeItems(area.items)
                            };

                            if (isOutsideKey(area.key)) {
                                core.inRow = !!area.inRow;
                            }

                            return core;
                        }

                        return {
                            id: area.id,
                            span: normalizeSpan(area.span),
                            design: normalizeDesign(area.design),
                            items: that.serializeItems(area.items)
                        };
                    })
                };
            },

            clearShopCache: function () {
                if (!this.cacheApiService || typeof this.cacheApiService.clear !== 'function') {
                    return Promise.resolve(false);
                }

                return this.cacheApiService.clear()
                    .then(function () { return true; })
                    .catch(function () { return false; });
            },

            /*
             * Speichert das Layout. Der Editor wird danach NICHT neu geladen:
             * Aenderungen, die waehrend des Speicherns passieren, bleiben
             * erhalten und gelten weiter als ungespeichert.
             */
            layoutSnapshot: function () {
                return JSON.stringify({
                    layout: this.serializeLayout(),
                    name: this.layoutName,
                    active: this.layoutActive,
                    channelIds: this.channelIds,
                    languageIds: this.languageIds
                });
            },

            /*
             * Speichert das aktuelle Layout mit Name, Status und Bereich. Wird
             * es aktiv geschaltet, werden andere aktive Layouts mit genau
             * demselben Verkaufskanal und derselben Sprache inaktiv - pro
             * Bereich ist immer nur eines aktiv.
             * Der Editor wird danach NICHT neu geladen: Aenderungen waehrend
             * des Speicherns bleiben erhalten.
             */
            saveLayout: function () {
                var that = this;
                var entity = this.record;

                if (!this.isDirty) {
                    return Promise.resolve();
                }

                if (!entity) {
                    entity = this.layoutRepository.create(Shopware.Context.api);
                }

                var sentJson = this.layoutSnapshot();
                var channels = this.channelIds.slice();
                var languages = this.languageIds.slice();

                entity.name = String(this.layoutName || '').trim() || this.$tc('dmx4all-footer-tool.layouts.unnamed');
                entity.active = !!this.layoutActive;
                entity.salesChannelIds = channels.length ? channels : null;
                entity.languageIds = languages.length ? languages : null;
                /* Einzelspalten nur bei genau einem Wert (Kompatibilitaet) */
                entity.salesChannelId = channels.length === 1 ? channels[0] : null;
                entity.languageId = languages.length === 1 ? languages[0] : null;
                entity.layout = this.serializeLayout();

                return this.layoutRepository.save(entity, Shopware.Context.api)
                    .then(function () {
                        if (!entity.active) {
                            return null;
                        }

                        /*
                         * Andere aktive Layouts abschalten, die denselben Bereich
                         * gleich genau abdecken: gleiche Art (alle / bestimmte) je
                         * Kanal und Sprache und mindestens eine Ueberschneidung.
                         */
                        var others = that.records.filter(function (entry) {
                            var entryC = entryChannels(entry);
                            var entryL = entryLanguages(entry);

                            return entry.id !== entity.id
                                && entry.active
                                && (entryC.length > 0) === (channels.length > 0)
                                && (entryL.length > 0) === (languages.length > 0)
                                && scopeOverlaps(entryC, channels)
                                && scopeOverlaps(entryL, languages);
                        });

                        return Promise.all(others.map(function (entry) {
                            entry.active = false;
                            that.createNotificationInfo && that.createNotificationInfo({
                                message: that.tr('dmx4all-footer-tool.layouts.deactivated', { name: entry.name || '' })
                            });

                            return that.layoutRepository.save(entry, Shopware.Context.api);
                        }));
                    })
                    .then(function () {
                        that.currentId = entity.id;

                        return that.loadRecords();
                    })
                    .then(function () {
                        if (that.layoutSnapshot() === sentJson) {
                            that.isDirty = false;
                        }
                    });
            },

            onSave: function (options) {
                var that = this;
                var auto = !!(options && options.auto);

                if (!this.canEdit) {
                    return Promise.resolve();
                }

                if (!this.isDirty && !this.configDirty) {
                    return Promise.resolve();
                }

                if (this.isSaving) {
                    return Promise.resolve();
                }

                this.stopAutosave();
                this.isSaving = true;
                this.saveFailed = false;

                return this.saveLayout()
                    .then(function () {
                        return that.saveConfig();
                    })
                    .then(function () {
                        return that.clearShopCache();
                    })
                    .then(function (cleared) {
                        that.lastSavedAt = new Date();

                        /* Beim automatischen Speichern reicht die Anzeige oben rechts */
                        if (!cleared) {
                            that.createNotificationWarning({
                                message: that.$tc('dmx4all-footer-tool.builder.saveSuccessNoCache')
                            });
                        } else if (!auto) {
                            that.createNotificationSuccess({
                                message: that.$tc('dmx4all-footer-tool.builder.saveSuccess')
                            });
                        }
                    })
                    .catch(function (error) {
                        that.saveFailed = true;
                        that.createNotificationError({
                            message: that.$tc('dmx4all-footer-tool.builder.saveError') + errorMessage(error)
                        });
                    })
                    .finally(function () {
                        that.isSaving = false;

                        /* Waehrend des Speicherns geaendert? Dann gleich wieder planen */
                        if (!that.saveFailed) {
                            that.scheduleAutosave();
                        }
                    });
            },

            /* -------------------------------------------------------------- */
            /* Automatisch speichern                                          */
            /* -------------------------------------------------------------- */

            onAutosaveChange: function (value) {
                var delay = parseInt(value, 10);

                this.autosaveDelay = AUTOSAVE_CHOICES.indexOf(delay) !== -1 ? delay : AUTOSAVE_DEFAULT;
                writeAutosaveDelay(this.autosaveDelay);
                this.scheduleAutosave();
            },

            stopAutosave: function () {
                if (this.autosaveTimer) {
                    window.clearInterval(this.autosaveTimer);
                }

                this.autosaveTimer = null;
                this.autosaveAt = 0;
                this.autosaveRemaining = 0;
            },

            /* Jede Aenderung startet die Wartezeit neu */
            scheduleAutosave: function () {
                var that = this;

                this.stopAutosave();

                if (!this.canEdit) {
                    return;
                }

                if (!(this.isDirty || this.configDirty)) {
                    return;
                }

                /* Eine neue Aenderung nach einem Fehler: Anzeige zuruecksetzen */
                this.saveFailed = false;

                if (this.autosaveDelay <= 0) {
                    return;
                }

                this.autosaveAt = Date.now() + (this.autosaveDelay * 1000);
                this.autosaveRemaining = this.autosaveDelay;

                this.autosaveTimer = window.setInterval(function () {
                    var rest = that.autosaveAt - Date.now();

                    that.autosaveRemaining = Math.max(1, Math.ceil(rest / 1000));

                    if (rest > 0) {
                        return;
                    }

                    /* Nicht mitten im Bearbeiten oder Ziehen speichern - kurz warten */
                    if (that.editing || that.drag || that.isSaving || that.isLoading) {
                        that.autosaveAt = Date.now() + 1000;

                        return;
                    }

                    that.stopAutosave();
                    that.onSave({ auto: true });
                }, 250);
            },

            onDelete: function () {
                var that = this;

                if (!this.canDelete) {
                    return Promise.resolve();
                }
                var entity = this.record;

                if (!entity) {
                    return Promise.resolve();
                }

                return this.askConfirm(this.tr('dmx4all-footer-tool.builder.confirmDelete', { name: entity.name || this.$tc('dmx4all-footer-tool.layouts.unnamed') }), {
                    confirmLabel: this.$tc('dmx4all-footer-tool.builder.buttonDelete'),
                    danger: true
                }).then(function (ok) {
                    if (ok) {
                        return that.deleteRecord(entity);
                    }
                });
            },

            deleteRecord: function (entity) {
                var that = this;

                this.isSaving = true;

                return this.layoutRepository.delete(entity.id, Shopware.Context.api)
                    .then(function () {
                        return that.loadRecords();
                    })
                    .then(function () {
                        var channelBefore = that.salesChannelId;

                        that.pickInitialLayout();
                        that.afterScopeChange(channelBefore);

                        return that.clearShopCache();
                    })
                    .then(function () {
                        that.createNotificationSuccess({
                            message: that.$tc('dmx4all-footer-tool.builder.deleteSuccess')
                        });
                    })
                    .catch(function (error) {
                        that.createNotificationError({
                            message: that.$tc('dmx4all-footer-tool.builder.deleteError') + errorMessage(error)
                        });
                    })
                    .finally(function () {
                        that.isSaving = false;
                    });
            },

            onSettings: function () {
                var that = this;

                return this.confirmDiscard().then(function (ok) {
                    if (ok) {
                        that.$router.push({ name: 'dmx4all.footer.tool.settings' });
                    }
                });
            }
        }
    });

    /* ------------------------------------------------------------------ */
    /* Infoseite unter Einstellungen > Erweiterungen                       */
    /*                                                                     */
    /* Hersteller, Support und Hilfe. Eingestellt wird alles im Footer     */
    /* Editor; die config.xml liefert nur die Standardwerte.               */
    /* ------------------------------------------------------------------ */

    Component.register('dmx4all-footer-tool-settings', {
        template: [
            '<sw-page class="dmx4all-footer-tool-settings">',
            '    <template #smart-bar-header>',
            '        <div class="dmx4all-page-title">',
            '            <h2>{{ $tc(\'dmx4all-footer-tool.settings.title\') }}</h2>',
            '            <span class="dmx4all-version-badge">',
            '                {{ $tc(\'dmx4all-footer-tool.support.version\') }} {{ pluginVersion }}',
            '            </span>',
            '        </div>',
            '    </template>',
            '',
            '    <template #smart-bar-actions>',
            '        <button class="dmx4all-save-hint"',
            '                type="button"',
            '                :title="$tc(\'dmx4all-footer-tool.settings.saveHint\')"',
            '                @click="onOpenDocs">',
            '            <mt-icon name="regular-exclamation-circle" size="16px" />',
            '        </button>',
            '        <mt-button variant="primary" size="default" @click="onOpenEditor">',
            '            {{ $tc(\'dmx4all-footer-tool.settings.openEditor\') }}',
            '        </mt-button>',
            '    </template>',
            '',
            '    <template #content>',
            '        <sw-card-view>',
            '            <mt-card class="dmx4all-editor-card"',
            '                     position-identifier="dmx4all-footer-tool-editor">',
            '                <div class="dmx4all-card-title">',
            '                    <img class="dmx4all-card-logo" :src="iconUrl" alt="">',
            '                    <span>{{ $tc(\'dmx4all-footer-tool.settings.editorTitle\') }}</span>',
            '                </div>',
            '                <p class="dmx4all-help__text">{{ $tc(\'dmx4all-footer-tool.settings.editorText\') }}</p>',
            '                <div class="dmx4all-help__actions">',
            '                    <mt-button variant="primary" size="small" @click="onOpenEditor">',
            '                        {{ $tc(\'dmx4all-footer-tool.settings.openEditor\') }}',
            '                    </mt-button>',
            '                </div>',
            '            </mt-card>',
            '',
            '            <mt-card class="dmx4all-support-card"',
            '                     position-identifier="dmx4all-footer-tool-support">',
            '                <div class="dmx4all-card-title">',
            '                    <img class="dmx4all-card-logo" :src="iconUrl" alt="">',
            '                    <span>{{ $tc(\'dmx4all-footer-tool.support.title\') }}</span>',
            '                </div>',
            '                <div class="dmx4all-support">',
            '                    <img class="dmx4all-support__logo" :src="iconUrl" alt="">',
            '',
            '                    <div class="dmx4all-support__body">',
            '                        <p class="dmx4all-support__name">{{ support.name }}</p>',
            '                        <p class="dmx4all-support__text">{{ $tc(\'dmx4all-footer-tool.support.text\') }}</p>',
            '                        <a class="dmx4all-support__link"',
            '                           :href="support.website"',
            '                           target="_blank"',
            '                           rel="noopener noreferrer">{{ support.websiteLabel }}</a>',
            '                        <a class="dmx4all-support__link"',
            '                           :href="\'mailto:\' + support.mail">{{ support.mail }}</a>',
            '                    </div>',
            '',
            '                    <div class="dmx4all-support__meta">',
            '                        <span>{{ $tc(\'dmx4all-footer-tool.support.plugin\') }}</span>',
            '                        <strong>{{ $tc(\'dmx4all-footer-tool.general.mainMenuItemGeneral\') }}</strong>',
            '                        <span v-if="pluginVersion">{{ $tc(\'dmx4all-footer-tool.support.version\') }} {{ pluginVersion }}</span>',
            '                    </div>',
            '                </div>',
            '            </mt-card>',
            '',
            '            <mt-card class="dmx4all-help-card"',
            '                     position-identifier="dmx4all-footer-tool-help">',
            '                <div class="dmx4all-card-title">',
            '                    <img class="dmx4all-card-logo" :src="iconUrl" alt="">',
            '                    <span>{{ $tc(\'dmx4all-footer-tool.help.title\') }}</span>',
            '                </div>',
            '',
            '                <p class="dmx4all-help__text">{{ $tc(\'dmx4all-footer-tool.help.text\') }}</p>',
            '',
            '                <dl class="dmx4all-help__list">',
            '                    <template v-for="row in infoRows" :key="row.label">',
            '                        <dt>{{ row.label }}</dt>',
            '                        <dd>{{ row.value }}</dd>',
            '                    </template>',
            '                </dl>',
            '',
            '                <div class="dmx4all-help__actions">',
            '                    <mt-button variant="primary" size="small" @click="onSupportMail">',
            '                        {{ $tc(\'dmx4all-footer-tool.help.buttonMail\') }}',
            '                    </mt-button>',
            '                    <mt-button variant="secondary" size="small" @click="onCopyInfo">',
            '                        {{ $tc(\'dmx4all-footer-tool.help.buttonCopy\') }}',
            '                    </mt-button>',
            '                    <mt-button variant="secondary" size="small" @click="onWebsite">',
            '                        {{ $tc(\'dmx4all-footer-tool.help.buttonWebsite\') }}',
            '                    </mt-button>',
            '                </div>',
            '            </mt-card>',
            '        </sw-card-view>',
            '',
            DOC_MODAL_TEMPLATE,
            '    </template>',
            '</sw-page>'
        ].join('\n'),

        mixins: [Shopware.Mixin.getByName('notification'), DOC_MIXIN],

        data: function () {
            return {
                support: SUPPORT
            };
        },

        computed: {
            pluginVersion: function () {
                return PLUGIN_VERSION;
            },

            iconUrl: function () {
                return assetBase() + '/img/plugin.png';
            },


            shopwareVersion: function () {
                var context = Shopware.Context;

                if (context && context.app && context.app.config && context.app.config.version) {
                    return context.app.config.version;
                }

                return this.$tc('dmx4all-footer-tool.help.unknown');
            },

            infoRows: function () {
                return [
                    {
                        label: this.$tc('dmx4all-footer-tool.help.labelPlugin'),
                        value: this.$tc('dmx4all-footer-tool.general.mainMenuItemGeneral')
                    },
                    {
                        label: this.$tc('dmx4all-footer-tool.help.labelTechnical'),
                        value: TECHNICAL_NAME
                    },
                    {
                        label: this.$tc('dmx4all-footer-tool.help.labelVersion'),
                        value: PLUGIN_VERSION
                    },
                    {
                        label: this.$tc('dmx4all-footer-tool.help.labelShopware'),
                        value: this.shopwareVersion
                    },
                    {
                        label: this.$tc('dmx4all-footer-tool.help.labelLicense'),
                        value: LICENSE
                    }
                ];
            },

            infoText: function () {
                return this.infoRows.map(function (row) {
                    return row.label + ': ' + row.value;
                }).join('\n');
            }
        },

        methods: {
            onCopyInfo: function () {
                var that = this;

                return copyToClipboard(this.infoText)
                    .then(function () {
                        that.createNotificationSuccess({
                            message: that.$tc('dmx4all-footer-tool.help.copySuccess')
                        });
                    })
                    .catch(function () {
                        that.createNotificationError({
                            message: that.$tc('dmx4all-footer-tool.help.copyError')
                        });
                    });
            },

            onSupportMail: function () {
                var subject = this.$tc('dmx4all-footer-tool.help.mailSubject')
                    + TECHNICAL_NAME + ' ' + PLUGIN_VERSION;

                var body = this.$tc('dmx4all-footer-tool.help.mailIntro')
                    + '\n\n---\n' + this.infoText;

                window.location.href = 'mailto:' + SUPPORT.mail
                    + '?subject=' + encodeURIComponent(subject)
                    + '&body=' + encodeURIComponent(body);
            },

            onWebsite: function () {
                window.open(SUPPORT.website, '_blank', 'noopener');
            },

            /* Alles Einstellbare liegt im Footer Editor */
            onOpenEditor: function () {
                this.$router.push({ name: 'dmx4all.footer.tool.list' });
            }
        }
    });

    /* ------------------------------------------------------------------ */
    /* Modul                                                               */
    /* ------------------------------------------------------------------ */

    /* ------------------------------------------------------------------ */
    /* Rechte (Einstellungen > Benutzer & Rechte > Rollen)                 */
    /*                                                                     */
    /*   viewer  - Footer Editor ansehen, exportieren                      */
    /*   editor  - bearbeiten, speichern, Anordnung aendern, Bilder         */
    /*   creator - Layouts anlegen, duplizieren, importieren               */
    /*   deleter - Layouts loeschen                                        */
    /* ------------------------------------------------------------------ */

    var ACL_KEY = 'dmx4all_footer_tool';

    try {
        var privilegesService = Shopware.Service('privileges');

        if (privilegesService && typeof privilegesService.addPrivilegeMappingEntry === 'function') {
            privilegesService.addPrivilegeMappingEntry({
                category: 'permissions',
                parent: 'content',
                key: ACL_KEY,
                roles: {
                    viewer: {
                        privileges: [
                            'dmx4all_footer_tool_layout:read',
                            'sales_channel:read',
                            'language:read',
                            'category:read',
                            'category_translation:read',
                            'media:read',
                            'media_folder:read',
                            'media_default_folder:read',
                            'system_config:read'
                        ],
                        dependencies: []
                    },
                    editor: {
                        privileges: [
                            'dmx4all_footer_tool_layout:update',
                            'system_config:create',
                            'system_config:update',
                            'system_config:delete',
                            /* Nach dem Speichern wird der Shop-Cache geleert */
                            'system:clear:cache',
                            /* Bilder hochladen und auswaehlen */
                            privilegesService.getPrivileges('media.creator')
                        ],
                        dependencies: [ACL_KEY + '.viewer']
                    },
                    creator: {
                        privileges: [
                            'dmx4all_footer_tool_layout:create'
                        ],
                        dependencies: [ACL_KEY + '.viewer', ACL_KEY + '.editor']
                    },
                    deleter: {
                        privileges: [
                            'dmx4all_footer_tool_layout:delete'
                        ],
                        dependencies: [ACL_KEY + '.viewer']
                    }
                }
            });
        }
    } catch (error) {
        if (window.console && window.console.warn) {
            window.console.warn('[Dmx4allFooterTool] Rechte konnten nicht registriert werden', error);
        }
    }

    /* Plugin-Icon statt Zahnrad unter Einstellungen > Erweiterungen */
    Component.register('dmx4all-footer-tool-settings-icon', {
        template: '<img class="dft-settings-icon" :src="src" alt="" width="16" height="16">',

        computed: {
            src: function () {
                return assetBase() + '/img/plugin.png';
            }
        }
    });

    Module.register('dmx4all-footer-tool', {
        type: 'plugin',
        name: 'dmx4all-footer-tool',
        title: 'dmx4all-footer-tool.general.mainMenuItemGeneral',
        description: 'dmx4all-footer-tool.general.descriptionTextModule',
        color: '#ff3d58',
        icon: 'regular-content',

        snippets: snippets,

        routes: {
            list: {
                component: 'dmx4all-footer-tool-builder',
                path: 'list',
                meta: {
                    privilege: 'dmx4all_footer_tool.viewer'
                }
            },
            settings: {
                component: 'dmx4all-footer-tool-settings',
                path: 'settings',
                meta: {
                    parentPath: 'dmx4all.footer.tool.list',
                    privilege: 'dmx4all_footer_tool.viewer'
                }
            }
        },

        /* Eintrag unter Einstellungen > Erweiterungen */
        settingsItem: [{
            group: 'plugins',
            to: 'dmx4all.footer.tool.settings',
            icon: 'regular-cog',
            iconComponent: 'dmx4all-footer-tool-settings-icon',
            label: 'dmx4all-footer-tool.general.mainMenuItemGeneral',
            privilege: 'dmx4all_footer_tool.viewer'
        }],

        /* Menuepunkt unter Inhalte */
        navigation: [{
            id: 'dmx4all-footer-tool',
            parent: 'sw-content',
            label: 'dmx4all-footer-tool.general.mainMenuItemGeneral',
            path: 'dmx4all.footer.tool.list',
            color: '#ff3d58',
            position: 100,
            privilege: 'dmx4all_footer_tool.viewer'
        }]
    });

    /* Styling ohne SCSS-Build */
    var LOGO_URL = assetBase() + '/img/plugin.png';

    /*
     * Kartenueberschriften im Footer Editor (Layouts, Anordnung, Bereiche)
     * bekommen das Plugin-Logo per CSS. Die Karten der Infoseite zeigen es
     * selbst im Template. Meteor- und aeltere sw-Karten werden adressiert.
     */
    var CARD_TITLE_SELECTORS = [
        '.dmx4all-footer-tool-builder .mt-card__title',
        '.dmx4all-footer-tool-builder .sw-card__title'
    ];

    var style = document.createElement('style');
    style.textContent = [
        '.dft-arrangement{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:32px;margin-top:16px}',
        '@media (max-width:1100px){.dft-arrangement{grid-template-columns:minmax(0,1fr)}}',
        '.dft-arrangement__fields .dft-field{max-width:360px}',
        '.dft-columns{display:flex;gap:12px;flex-wrap:wrap}',
        '.dft-field--small{min-width:0;width:110px}',
        '.dft-arrangement__preview{display:flex;flex-direction:column;gap:10px}',
        '.dft-preview{display:grid;gap:8px;padding:12px;border-radius:4px;background:#2b3136}',
        '.dft-preview__block{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:4px;min-width:0;min-height:52px;padding:6px 8px;border-radius:3px;font-size:12px;font-weight:600;line-height:1.3;overflow:hidden}',
        '.dft-preview__label{font-size:10px;font-weight:600;opacity:.75}',
        '.dft-preview__text{font-size:11px;font-weight:400;word-break:break-word;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
        '.dft-preview__text.is--placeholder{font-style:italic;opacity:.7}',
        '.dft-preview__img{display:block;max-width:100%;max-height:36px;object-fit:contain;background:rgba(255,255,255,.9);border-radius:2px;padding:2px}',
        '.dft-preview__img.is--center{align-self:center}',
        '.dft-preview__img.is--right{align-self:flex-end}',
        '.dft-preview__img.is--left{align-self:flex-start}',
        '.dft-preview__block.is--core,.dft-preview__block.is--empty{align-items:center;justify-content:center;text-align:center}',
        '.dft-preview__block.is--core .dft-preview__text{text-align:left;align-self:stretch}',
        '.dft-preview__block.is--core .dft-preview__label,.dft-preview__block.is--empty .dft-preview__label{font-size:12px;opacity:1}',
        '.dft-preview__block.is--core{background:#52667a;color:#fff}',
        '.dft-preview__block.is--own{background:#189eff;color:#fff}',
        '.dft-preview__block.is--empty{border:1px dashed #758ca3;color:#9aa8b5;font-weight:400}',
        '.dft-langs{margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e0e6eb}',
        '.dft-langs__tabs{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}',
        '.dft-langs__tab{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid #d1d9e0;border-radius:4px;background:#fff;color:#52667a;font-size:13px;cursor:pointer}',
        '.dft-langs__tab.is--missing{border-style:dashed;color:#9aa8b5}',
        '.dft-langs__tab.is--active{background:#189eff;border-color:#189eff;border-style:solid;color:#fff}',
        '.dft-langs__default{padding:0 5px;border-radius:2px;background:rgba(0,0,0,.08);font-size:11px}',
        '.dft-item__missing{display:block;margin-top:4px;color:#b25e00;font-size:11px}',
        '.dft-confirm__text{margin:0;font-size:14px;line-height:1.5;color:#2b3136}',
        '.dft-undo{position:fixed;left:50%;bottom:24px;z-index:1000;display:flex;align-items:center;gap:14px;padding:10px 12px 10px 16px;border-radius:6px;background:#2b3136;color:#fff;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.25);transform:translateX(-50%)}',
        '.dft-undo__button{padding:4px 10px;border:1px solid #6ed0ff;border-radius:4px;background:transparent;color:#6ed0ff;font-size:13px;font-weight:600;cursor:pointer}',
        '.dft-undo__button:hover{background:rgba(110,208,255,.15)}',
        '.dft-undo__close{padding:0 4px;border:0;background:transparent;color:#9aa8b5;font-size:18px;line-height:1;cursor:pointer}',
        '.dft-size{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap}',
        '.dft-size__part{display:flex;align-items:center;gap:6px;font-size:13px;color:#52667a}',
        '.dft-size__input{width:96px;height:40px}',
        '.dft-size__unit{width:64px;height:40px;padding:0 6px}',
        '.dft-size__suffix{color:#758ca3}',
        '.dft-size__times{padding-bottom:10px;color:#9aa8b5}',
        '.dft-item__size{display:inline-block;margin-top:4px;padding:1px 6px;border-radius:8px;background:#e8f4ff;color:#0870c3;font-size:11px;font-weight:600}',
        '.dft-layouts{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:24px;margin-top:12px}',
        '@media (max-width:1100px){.dft-layouts{grid-template-columns:minmax(0,1fr)}}',
        '.dft-layouts__list{display:flex;flex-direction:column;gap:6px}',
        '.dft-layout-row{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:\"name badge\" \"scope badge\";align-items:center;gap:2px 10px;width:100%;padding:8px 12px;border:1px solid #d1d9e0;border-radius:4px;background:#fff;color:#2b3136;font-size:13px;text-align:left;cursor:pointer}',
        '.dft-layout-row:hover{border-color:#189eff}',
        '.dft-layout-row.is--current{border-color:#189eff;background:#f0f8ff;box-shadow:inset 3px 0 0 #189eff}',
        '.dft-layout-row.is--new{cursor:default}',
        '.dft-layout-row__name{grid-area:name;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '.dft-layout-row__scope{grid-area:scope;color:#758ca3;font-size:12px}',
        '.dft-layout-row__badge{grid-area:badge;padding:1px 8px;border-radius:2px;font-size:11px;font-weight:600;white-space:nowrap}',
        '.dft-layout-row__badge.is--active{background:#e6f6ec;border:1px solid #b8e2c8;color:#1f6c3d}',
        '.dft-layout-row__badge.is--inactive{background:#f5f7f9;border:1px solid #d1d9e0;color:#758ca3}',
        '.dft-layout-row__badge.is--new{background:#fff4e0;border:1px solid #ffd699;color:#8a5a00}',
        '.dft-layouts__actions{display:flex;gap:16px;margin-top:6px}',
        '.dft-layouts__actions .dft-link{margin-left:0}',
        '.dft-link.is--danger{color:#de294c}',
        '.dft-link:disabled{color:#b3c0cc;cursor:default;text-decoration:none}',
        '.dft-layouts__detail .dft-field{max-width:420px}',
        '.dft-hidden-file{display:none}',
        '.dft-import-list{display:flex;flex-direction:column;gap:6px;margin:12px 0;max-height:320px;overflow:auto}',
        '.dft-import-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid #d1d9e0;border-radius:4px;cursor:pointer;font-size:13px}',
        '.dft-import-row__name{font-weight:600;color:#2b3136}',
        '.dft-import-row__scope{margin-left:auto;color:#758ca3;font-size:12px}',
        '.dft-import-option{display:flex;align-items:center;gap:8px;margin:8px 0 12px;font-size:13px;color:#2b3136;cursor:pointer}',
        '.dft-multi{display:flex;flex-wrap:wrap;gap:6px}',
        '.dft-layouts__detail .dft-field.dft-field--wide{max-width:none}',
        '.dft-export-choice{display:flex;flex-direction:column;gap:10px}',
        '.dft-export-option{display:flex;flex-direction:column;align-items:flex-start;gap:4px;width:100%;padding:12px 14px;border:1px solid #d1d9e0;border-radius:4px;background:#fff;color:#2b3136;font-size:14px;text-align:left;cursor:pointer}',
        '.dft-export-option span{color:#758ca3;font-size:12px}',
        '.dft-export-option:hover,.dft-export-option:focus-visible{border-color:#189eff;background:#f0f8ff;outline:none}',
        '.dft-design-button{position:relative}',
        '.dft-design-button__swatch{display:block;width:12px;height:12px;border-radius:3px;border:1px solid #9aa8b5;background:linear-gradient(135deg,#fff 45%,#de294c 45%,#de294c 55%,#fff 55%)}',
        '.dft-design-button.is--set .dft-design-button__swatch{background:#189eff;border-color:#0870c3}',
        '.dft-design{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:24px}',
        '@media (max-width:900px){.dft-design{grid-template-columns:minmax(0,1fr)}}',
        '.dft-design__group{margin:0 0 16px;padding:10px 14px 4px;border:1px solid #e0e6eb;border-radius:4px}',
        '.dft-design__group legend{padding:0 6px;color:#2b3136;font-size:13px;font-weight:700}',
        '.dft-design__row{display:grid;grid-template-columns:150px minmax(0,1fr) 26px;align-items:center;gap:10px;margin-bottom:8px}',
        '.dft-design__label{color:#52667a;font-size:13px}',
        '.dft-design__color{display:flex;align-items:center;gap:8px}',
        '.dft-design__picker{width:36px;height:32px;padding:0;border:1px solid #d1d9e0;border-radius:4px;background:#fff;cursor:pointer}',
        '.dft-design__input{height:34px;flex:1 1 auto;min-width:0}',
        '.dft-design__preview{display:flex;flex-direction:column;gap:10px;position:sticky;top:0;align-self:start}',
        '.dft-design__sample{padding:16px;border:1px dashed #d1d9e0;border-radius:4px;background:#fff;color:#2b3136;font-size:14px}',
        '.dft-design__sample p{margin:6px 0 10px}',
        '.dft-design__sample-heading{font-weight:700;font-size:1.1em}',
        '.dft-settings-icon{display:block;width:16px;height:16px;object-fit:contain;border-radius:3px}',
        '.dft-readonly-note{margin:0 0 20px;padding:10px 14px;border:1px solid #ffd699;border-radius:4px;background:#fff4e0;color:#8a5a00;font-size:13px;font-weight:600}',
        '.is--readonly .dft-layouts__detail,.is--readonly .dft-arrangement__fields,.is--readonly .dft-grid,.is--readonly .dft-outside,.is--readonly .dft-hidden-core{pointer-events:none;opacity:.75}',
        '.dft-core-fallback{margin:0;padding:6px 8px;border-radius:3px;background:#fff4e0;color:#8a5a00;font-size:12px}',
        '.dft-scope-warning{color:#de294c;font-weight:700;margin-right:2px}',
        '.dft-chip.is--deleted,.dft-chip.is--deleted.is--active{background:#fde8eb;border-color:#f5a5b3;color:#a3162f}',
        '.dft-status--warning{margin-bottom:8px;background:#fde8eb;border-color:#f5a5b3;color:#a3162f}',
        '.dft-muted{margin:0;color:#758ca3;font-size:13px}',
        '.dft-title-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
        '.dft-help-button{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:18px !important;height:18px !important;min-width:0 !important;min-height:0 !important;max-width:20px;max-height:20px;margin:0;padding:0 !important;border:0;border-radius:50%;background:#189eff;color:#fff;font-family:inherit;font-size:11px !important;font-weight:700;line-height:18px !important;cursor:pointer;flex:0 0 18px;vertical-align:middle}',
        '.dft-help-button:hover{background:#0870c3}',
        '.dft-help-button:focus-visible{outline:2px solid #189eff;outline-offset:2px}',
        '.dft-save-status{display:inline-flex;align-items:center;gap:6px;padding:1px 8px;border-radius:2px;border:1px solid #d1d9e0;background:#fff;color:#52667a;font-size:12px;font-weight:600;line-height:inherit;white-space:nowrap}',
        '.dft-save-status__dot{width:7px;height:7px;border-radius:50%;background:#9aa8b5;flex:0 0 auto}',
        '.dft-save-status.is--saved{border-color:#b8e2c8;background:#e6f6ec;color:#1f6c3d}',
        '.dft-save-status.is--saved .dft-save-status__dot{background:#37d046}',
        '.dft-save-status.is--pending,.dft-save-status.is--dirty{border-color:#ffd699;background:#fff4e0;color:#8a5a00}',
        '.dft-save-status.is--pending .dft-save-status__dot,.dft-save-status.is--dirty .dft-save-status__dot{background:#ffab22}',
        '.dft-save-status.is--saving{border-color:#a6d4ff;background:#e8f4ff;color:#0870c3}',
        '.dft-save-status.is--saving .dft-save-status__dot{background:#189eff;animation:dft-pulse 1s ease-in-out infinite}',
        '.dft-save-status.is--error{border-color:#f5a5b3;background:#fde8eb;color:#a3162f}',
        '.dft-save-status.is--error .dft-save-status__dot{background:#de294c}',
        '@keyframes dft-pulse{0%,100%{opacity:1}50%{opacity:.3}}',
        '.dft-autosave{display:inline-flex;align-items:center;gap:6px;align-self:center;margin-right:12px;color:#52667a;font-size:12px;font-weight:600;white-space:nowrap}',
        '.dft-autosave__select{height:32px;padding:0 6px;border:1px solid #d1d9e0;border-radius:4px;background:#fff;color:#2b3136;font-size:12px}',
        '.dft-field{display:flex;flex-direction:column;gap:6px;min-width:220px;margin-bottom:16px}',
        '.dft-field__label{font-size:14px;font-weight:600;color:#2b3136}',
        '.dft-select{height:48px;padding:0 12px;border:1px solid #d1d9e0;border-radius:4px;background:#fff;color:#2b3136;font-size:14px}',
        '.dft-select:focus{outline:none;border-color:#189eff;box-shadow:0 0 4px rgba(24,158,255,.3)}',
        '.dft-status{padding:10px 14px;border-radius:4px;background:#f5f7f9;border:1px solid #e0e6eb;color:#52667a;font-size:13px;line-height:1.5}',
        '.dft-status.is--own{background:#e6f6ec;border-color:#b8e2c8;color:#1f6c3d}',
        '.dft-existing{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:16px}',
        '.dft-existing .dft-field__label{margin-right:4px;font-size:13px}',
        '.dft-chip{padding:4px 10px;border:1px solid #d1d9e0;border-radius:12px;background:#fff;color:#52667a;font-size:12px;cursor:pointer}',
        '.dft-chip:hover{border-color:#189eff;color:#189eff}',
        '.dft-chip.is--active{background:#189eff;border-color:#189eff;color:#fff}',
        '.dft-link{padding:0;border:0;background:transparent;color:#189eff;font-size:13px;cursor:pointer;margin-left:6px}',
        '.dft-link:hover{text-decoration:underline}',
        '.dft-grip{display:inline-block;width:8px;height:14px;flex:0 0 auto;background-image:radial-gradient(circle,#9aa8b5 1.2px,transparent 1.4px);background-size:4px 4px;background-position:0 0}',
        '.dft-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}',
        '.dft-area{display:flex;flex-direction:column;min-width:0;min-height:180px;border:1px solid #d1d9e0;border-radius:4px;background:#fff;transition:border-color .15s,background-color .15s}',
        '.dft-grid.is--dragging .dft-area{border-style:dashed}',
        '.dft-area.is--target{border-color:#189eff;background:#f0f8ff}',
        '.dft-area__head{display:flex;align-items:center;justify-content:space-between;gap:4px;min-width:0;padding:4px 4px 4px 10px;border-bottom:1px solid #e0e6eb;color:#52667a;font-size:12px;font-weight:600}',
        '.dft-area__tools{display:flex;flex:0 0 auto;gap:0}',
        '.dft-area.is--core{background:#f5f7f9;border-color:#b3c0cc}',
        '.dft-area.is--core .dft-area__head{background:#e9edf1}',
        '.dft-core-head{display:flex;flex-direction:column;gap:8px;padding:10px 12px 4px}',
        '.dft-core-head__row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
        '.dft-core-mode{height:26px;padding:0 4px;border:1px solid #b3c0cc;border-radius:3px;background:#fff;color:#2b3136;font-size:12px;max-width:100%}',
        '.dft-core-headline{display:inline-flex;align-items:center;gap:6px;max-width:100%;padding:4px 8px;border:1px dashed #b3c0cc;border-radius:3px;background:#fff;color:#2b3136;font-size:12px;font-weight:600;text-align:left;cursor:pointer}',
        '.dft-core-headline:hover{border-color:#189eff;color:#189eff}',
        '.dft-core-headline span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '.dft-core-note{margin:0;font-size:12px}',
        '.dft-area.is--core:not(.is--locked) .dft-area__body{background:#fff;margin:0 8px 8px;border-radius:3px}',
        '.dft-core-badge{display:inline-block;padding:2px 8px;border-radius:10px;background:#52667a;color:#fff;font-size:11px;font-weight:600}',
        '.dft-hidden-core{margin:0 0 12px}',
        '.dft-outside{margin-top:16px;padding:12px;border:1px dashed #b3c0cc;border-radius:4px;background:#fafbfc}',
        '.dft-outside .dft-muted{margin:4px 0 10px}',
        '.dft-outside__item{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 10px;margin-top:6px;border:1px solid #d1d9e0;border-radius:4px;background:#f5f7f9;font-size:13px;color:#2b3136}',
        '.dft-outside__actions{margin-left:auto;display:flex;gap:12px}',
        '.dft-outside__actions .dft-link{margin-left:0}',
        '.dft-inline-hint{margin:0 0 16px;max-width:360px}',
        '.dft-area__title{display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;padding:4px 4px 4px 0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;cursor:grab;user-select:none;touch-action:none}',
        '.dft-area.is--area-dragging{opacity:.5;border-style:dashed}',
        '.dft-area.is--area-drop,.dft-area-add.is--area-drop{box-shadow:-6px 0 0 0 #189eff;background:#f0f8ff}',
        '.dft-area.is--full .dft-area__head{background:#f0f8ff}',
        '.dft-grid-hint{margin:-8px 0 12px}',
        '.dft-span{margin-left:auto;height:24px;padding:0 4px;border:1px solid #d1d9e0;border-radius:3px;background:#fff;color:#52667a;font-size:12px}',
        '.dft-area__add{align-items:center;flex-wrap:wrap;row-gap:6px}',
        '.dft-area__add .dft-link{white-space:nowrap}',
        '.dft-area__title-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '.dft-area__tools .dft-icon-button{width:20px;height:22px;flex:0 0 20px}',
        '.dft-icon-button:disabled{opacity:.3;cursor:default;background:transparent !important;color:#758ca3 !important}',
        '.dft-area-add{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:180px;border:1px dashed #b3c0cc;border-radius:4px;background:transparent;color:#52667a;font-size:13px;font-weight:600;cursor:pointer}',
        '.dft-area-add:hover{border-color:#189eff;color:#189eff;background:#f0f8ff}',
        '.dft-area-add:focus-visible{outline:2px solid #189eff;outline-offset:1px}',
        '.dft-area-add__plus{font-size:28px;line-height:1;font-weight:400}',
        '.dft-area__body{flex:1 1 auto;display:flex;flex-direction:column;gap:6px;padding:8px}',
        '.dft-area__empty{margin:auto 0;padding:16px 8px;text-align:center;color:#9aa8b5;font-size:12px}',
        '.dft-area__add{display:flex;gap:4px;padding:6px 12px 10px;border-top:1px solid #f0f2f5}',
        '.dft-area__add .dft-link{margin-left:0;margin-right:10px;font-size:12px}',
        '.dft-item{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 8px;border:1px solid #e0e6eb;border-radius:4px;background:#fafbfc;cursor:grab;user-select:none}',
        '.dft-item:hover{border-color:#b3c0cc;background:#fff}',
        '.dft-item.is--dragging{opacity:.5;border-style:dashed}',
        '.dft-item.is--empty{border-style:dashed;border-color:#ffb75d;background:#fffaf2}',
        '.dft-item.is--drop-before{box-shadow:0 -5px 0 -1px #189eff}',
        '.dft-area__body.is--drop-end::after{content:"";display:block;height:4px;border-radius:2px;background:#189eff}',
        '.dft-item__thumb{pointer-events:none;-webkit-user-drag:none}',
        '.dft-item{touch-action:none}',
        '.dft-ghost{position:fixed;z-index:100000;display:inline-flex;align-items:center;gap:8px;max-width:260px;padding:6px 12px;border:1px solid #189eff;border-radius:16px;background:#fff;color:#2b3136;font-size:13px;font-weight:600;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.2)}',
        '.dft-ghost__label{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
        'body.dft-is-dragging,body.dft-is-dragging *{cursor:grabbing !important;user-select:none !important}',
        '.dft-item__preview{flex:1 1 auto;min-width:0}',
        '.dft-item__text{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;color:#2b3136;font-size:12px;line-height:1.4;word-break:break-word}',
        '.dft-item__thumb{display:block;max-width:100%;max-height:60px;object-fit:contain}',
        '.dft-item__actions{display:flex;flex-direction:column;gap:2px;flex:0 0 auto}',
        '.dft-icon-button{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:2px;background:transparent;color:#758ca3;cursor:pointer}',
        '.dft-icon-button:hover{background:#e8f4ff;color:#189eff}',
        '.dft-icon-button.is--danger:hover{background:#fde8eb;color:#de294c}',
        '.dft-icon-button:focus-visible,.dft-link:focus-visible,.dft-chip:focus-visible{outline:2px solid #189eff;outline-offset:1px}',
        '.dft-modal__fields{margin-top:24px}',
        '.dft-segment{display:inline-flex;border:1px solid #d1d9e0;border-radius:4px;overflow:hidden;align-self:flex-start}',
        '.dft-segment button{padding:8px 16px;border:0;border-right:1px solid #d1d9e0;background:#fff;color:#52667a;font-size:13px;cursor:pointer}',
        '.dft-segment button:last-child{border-right:0}',
        '.dft-segment button.is--active{background:#189eff;color:#fff}',
        '.dmx4all-card-title{display:flex;align-items:center;gap:10px;margin-bottom:24px;padding-bottom:14px;border-bottom:1px solid #dfe3e8;color:#2b3136;font-size:16px;font-weight:600;line-height:1.3}',
        '.dmx4all-card-logo{width:20px;height:20px;object-fit:contain;border-radius:4px;flex:0 0 auto}',
        '.dmx4all-support{display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap}',
        '.dmx4all-support__logo{width:56px;height:56px;object-fit:contain;border-radius:8px;flex:0 0 auto}',
        '.dmx4all-support__body{flex:1 1 240px;min-width:0}',
        '.dmx4all-support__name{margin:0 0 4px 0;font-weight:600}',
        '.dmx4all-support__text{margin:0 0 8px 0;color:#758ca3}',
        '.dmx4all-support__link{display:block;text-decoration:none}',
        '.dmx4all-support__link:hover{text-decoration:underline}',
        '.dmx4all-support__meta{display:flex;flex-direction:column;gap:2px;text-align:right;color:#758ca3;flex:0 0 auto}',
        '.dmx4all-support__meta strong{color:#52667a}',
        '.dmx4all-help__text{margin:0 0 16px 0;color:#758ca3}',
        '.dmx4all-help__list{display:grid;grid-template-columns:auto 1fr;gap:6px 24px;margin:0 0 20px 0}',
        '.dmx4all-help__list dt{color:#758ca3;margin:0}',
        '.dmx4all-help__list dd{margin:0;color:#2b3136;word-break:break-word}',
        '.dmx4all-help__actions{display:flex;gap:8px;flex-wrap:wrap}',
        '.dmx4all-save-hint{display:inline-flex;align-items:center;margin-right:8px;padding:4px;border:0;border-radius:2px;background:transparent;color:#758ca3;cursor:pointer}',
        '.dmx4all-save-hint:hover{color:#189eff;background:#f0f6fa}',
        '.dmx4all-doc__bar{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px;border-bottom:1px solid #dfe3e8}',
        '.dmx4all-doc__tabs,.dmx4all-doc__langs{display:flex;gap:4px}',
        '.dmx4all-doc__tab,.dmx4all-doc__lang{padding:8px 12px;border:0;background:transparent;color:#52667a;cursor:pointer;border-bottom:2px solid transparent;font-size:14px}',
        '.dmx4all-doc__tab.is--active{color:#189eff;border-bottom-color:#189eff;font-weight:600}',
        '.dmx4all-doc__lang{border-bottom:0;border-radius:2px}',
        '.dmx4all-doc__lang.is--active{background:#e6f6ec;border:1px solid #b8e2c8;color:#1f6c3d;font-weight:600}',
        '.dmx4all-doc__body{max-height:60vh;overflow:auto}',
        '.dmx4all-doc__error{color:#758ca3}',
        '.dmx4all-doc__error p{margin:0 0 6px 0}',
        '.dmx4all-doc__content h2{margin:0 0 12px 0;font-size:20px}',
        '.dmx4all-doc__content h3{margin:24px 0 8px 0;font-size:16px}',
        '.dmx4all-doc__content h4,.dmx4all-doc__content h5{margin:16px 0 6px 0;font-size:14px}',
        '.dmx4all-doc__content p{margin:0 0 8px 0;line-height:1.5}',
        '.dmx4all-doc__content ul{margin:0 0 12px 0;padding-left:20px}',
        '.dmx4all-doc__content li{margin-bottom:4px;line-height:1.5}',
        '.dmx4all-doc__content code{padding:1px 4px;border-radius:2px;background:#f0f2f5;font-family:monospace;font-size:13px}',
        '.dmx4all-doc__content pre{margin:0 0 12px 0;padding:12px;border-radius:2px;background:#f0f2f5;overflow:auto}',
        '.dmx4all-doc__content pre code{padding:0;background:transparent}',
        '.dmx4all-doc__table{border-collapse:collapse;margin:0 0 12px 0;width:100%}',
        '.dmx4all-doc__table td{padding:6px 10px;border:1px solid #dfe3e8;vertical-align:top}',
        CARD_TITLE_SELECTORS.join(',') + '{display:flex;align-items:center;gap:10px;color:#2b3136;font-size:16px;font-weight:600;line-height:1.3}',
        CARD_TITLE_SELECTORS.map(function (selector) { return selector + '::before'; }).join(',')
            + '{content:"";display:inline-block;width:20px;height:20px;flex:0 0 auto;border-radius:4px;'
            + 'background-image:url(' + LOGO_URL + ');background-size:contain;'
            + 'background-repeat:no-repeat;background-position:center}',
        '.dmx4all-page-title{display:flex;flex-direction:column;align-items:flex-start;gap:4px;line-height:1.2}',
        '.dmx4all-page-title h2{margin:0}',
        '.dmx4all-version-badge{display:inline-block;padding:1px 8px;border-radius:2px;background:#e6f6ec;border:1px solid #b8e2c8;color:#1f6c3d;font-size:12px;font-weight:600;white-space:nowrap}'
    ].join('');
    document.head.appendChild(style);
})();
