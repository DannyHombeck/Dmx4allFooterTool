# 1.16.2
- Fallbacks: "Own elements only" without visible content shows the Shopware content instead of an empty column (with hint in the editor); deleted sales channels and languages are marked and can be removed with one click, layouts without effect are shown as such

# 1.16.1
- Inconsistencies fixed: Shopware parts are consistently labelled "From Shopware" (logos and bottom bar are not columns), button "Hide"; removed the "configuration domain" info row; removed unused template leftovers from the plugin class

# 1.16.0
- Permissions for admin users: own entry "DMX4ALL Footer Editor" under Content in roles with view, edit, create and delete; menu, pages and buttons follow them, without edit permission the editor is read-only

# 1.15.6
- Cleaned up: removed leftovers of the former settings fields (logo rules for sw-system-config cards, outdated comments)

# 1.15.5
- Settings page is now an info page: the duplicate arrangement fields are gone (everything is set in the Footer Editor), new button "Open Footer Editor"; config.xml stays for the default values on installation

# 1.15.4
- Plugin logo before all card headings in the Footer Editor (Layouts, Arrangement, Areas), as on the settings page

# 1.15.3
- Settings › Extensions shows the plugin icon instead of the cog

# 1.15.2
- New, easy-to-read plugin description (German/English) at the top of the README and in the plugin list

# 1.15.1
- Tile header: buttons (design, arrows, back, hide) no longer overflow the tile edge; long titles are shortened with …

# 1.15.0
- Design per area: background colour, padding, border (width, style, colour, radius), text colour, font size and weight, line height, alignment, heading colour, link colour, hover colour and underline – for every area and default column individually, with live preview; also shown in the desktop preview

# 1.14.8
- Cleaned up: removed unused code, styles and snippets; editor and settings share the help dialog code; storefront CSS is output only once per page; README (German/English) rewritten and up to date

# 1.14.7
- Licence changed to MIT (composer.json, LICENSE.md, English original and German translation in the help dialog)

# 1.14.6
- Licence changed to freeware: free use on any number of shops, including commercial; unmodified free redistribution allowed; selling not allowed

# 1.14.5
- "Delete layout" moved from the top bar into the "Layouts" card (next to Duplicate); confirmation names the layout

# 1.14.4
- One "Export" button instead of two: asks "This layout" or "All layouts"; with only one layout it exports directly

# 1.14.3
- Help button fixed at 18 × 18 px, also against general button styles of the administration

# 1.14.2
- Help dialog: licence now separately in German and English; wrapped lines in manual, changelog and licence are joined into paragraphs and list items instead of being shown individually

# 1.14.1
- Help button (? in a circle) before the version badge in the editor: opens manual, changelog and licence in German or English

# 1.14.0
- Layouts for multiple sales channels and languages: multiple selection per layout, the most specific active layout wins; activating deactivates overlapping layouts of equal specificity; export/import with lists; existing assignments are carried over

# 1.13.0
- Export and import layouts: single or all layouts as JSON file incl. arrangement and image addresses; import with selection creates new inactive layouts, maps unknown sales channels/languages to "All" and recreates missing images from their address

# 1.12.0
- Multiple layouts: create, duplicate, rename and activate/deactivate any number of named layouts; exactly one is active per sales channel and language; existing layouts are named "Standard" and stay active

# 1.11.5
- Display name changed: "DMX4ALL Footer Tool" is now "DMX4ALL Footer Editor" (menu, settings, plugin list, help texts); technical name Dmx4allFooterTool stays so updates and saved layouts are kept

# 1.11.4
- Save status now sits next to the version number, at the same height and in the same style

# 1.11.3
- Sales channels, languages and footer categories: if the regular search fails on an unreadable server response, it is repeated as plain JSON and leading text (e.g. PHP warnings) is skipped; the start of the response is logged to the console for diagnosis

# 1.11.2
- Image tile showed "No image selected" despite an image when no size was set (order of display conditions)

# 1.11.1
- Settings fully translated: config.xml now uses English as default and German with lang="de-DE" (German mapping was missing before, e.g. "Next to default columns"); help texts updated

# 1.11.0
- Image size configurable: width in px or %, height in px, both optional; aspect ratio is kept, with both values the image is fitted instead of distorted; size shown in tile and preview; previous maximum width is carried over

# 1.10.1
- Removed the "Drag into an area: Text / Image" bar; elements are added via "+ Text" / "+ Image" in each area

# 1.10.0
- Logos and bottom bar split into separate parts: payment logos, shipping logos, service menu, VAT notice and copyright can be hidden, edited and moved into the column row individually; existing settings are carried over

# 1.9.2
- Fixed admin crash (i.$t is not a function): texts with placeholders now only use $tc, which exists in Shopware 6.7

# 1.9.1
- Removing without browser prompt: elements are removed immediately with 8 seconds to undo; all other confirmations use an own dialog instead of window.confirm, because Firefox can permanently suppress page dialogs, leaving buttons without effect

# 1.9.0
- Default column content editable: per column Shopware content, Shopware plus own elements, or own elements only, with texts and images via drag and drop; own headline per language for hotline and navigation columns; layouts that only change default columns are applied in the shop

# 1.8.0
- Auto-save: configurable delay (off, 3, 5, 10, 30, 60 s; default 5 s, remembered per browser), status indicator with countdown, saving, saved-at time and error state; changes made while saving are no longer lost

# 1.7.2
- Auto-scroll while dragging only starts after the pointer has left the edge zone once; previously grabbing "Text"/"Image" near the header scrolled the page away and the grid disappeared

# 1.7.1
- While dragging only a small label follows below right of the pointer instead of a copy of the whole tile; target and insertion line stay visible, clearer insertion markers

# 1.7.0
- Payment/shipping logos and bottom bar (service menu, VAT notice, copyright) as default parts: stay in place or can be moved into the column row, positioned, widened and hidden

# 1.6.1
- Loading hardened: sales channels, languages, layouts, settings and footer categories load independently; an error in one part no longer blocks the builder, the message names the affected part

# 1.6.0
- All footer columns freely positionable: service hotline and every footer navigation column appear in the grid and can be moved, widened and hidden; preview includes them; fixed placeholders in hint texts and wrapping links

# 1.5.1
- Desktop preview shows the real content (texts in the selected language, images with alignment) and updates on every change; empty elements are ignored as in the shop

# 1.5.0
- Freely positionable areas: width per area (1 to 12 columns or full width), rearrange areas by dragging their title, admin grid mirrors the desktop columns of the shop

# 1.4.0
- Dynamic number of areas: add (up to 24), remove and reorder areas; new layouts start with 4 areas; up to 12 columns

# 1.3.3
- Dropped elements are placed in the area immediately, without a dialog covering the areas; empty elements are marked; dragging protected against native browser drag and foreign event handlers

# 1.3.2
- Dragging rebuilt on pointer events instead of HTML5 drag and drop: elements stay visible, a copy follows the pointer, auto-scroll at the edges, cancel with Esc, works with touch as well

# 1.3.1
- Fixed drag and drop: dragged elements disappeared because the DOM changed at drag start; insertion marker no longer shifts elements; preview images no longer start a native browser drag

# 1.3.0
- Translatable content: texts, alt texts and links per language with language tabs in the edit dialog, fallback to the default language, missing translations shown in the grid

# 1.2.0
- Configurable arrangement: new card "Arrangement in the footer" with preview, order (first/between/last), hotline and navigation can be hidden, values per sales channel with inheritance; all texts as German and English snippets (admin and storefront)

# 1.1.1
- Fixed Twig error "Unclosed comment" in columns.html.twig (CSS rule {#footerColumns was parsed as a Twig comment)

# 1.1.0
- New position "Next to default columns" (now default): filled areas become additional columns next to hotline and footer navigation; installations set to "Replace" are switched on update

# 1.0.0
- First release: 8 footer areas with text and image via drag and drop, 4 columns by default
