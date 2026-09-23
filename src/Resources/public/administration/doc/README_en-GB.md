# DMX4ALL Footer Editor

**Your shop's footer – exactly the way you want it.**

The DMX4ALL Footer Editor lets you design the bottom section of your Shopware
shop without any coding. Create your own areas, fill them with texts and
images and arrange everything by drag and drop to suit your shop – side by
side, stacked or across the full width.

The familiar Shopware parts such as the service hotline, the information
links, the payment and shipping logos or the copyright can also be moved,
extended, replaced or hidden. Each area can get its own look if you like:
background colour, border, font and link colours.

**Highlights**

- Your own areas with texts and images, arranged by drag and drop
- Position and edit every default part of the Shopware footer
- Design per area: colours, borders, fonts and links
- Several layouts, e.g. for Christmas or campaigns, activated with one click
- Different layouts per sales channel and language, translatable texts
- Preview in the admin, auto-save, export and import
- Works on desktop, tablet and smartphone

---

## Overview

Freely designs the Shopware 6.7 storefront footer: own areas with texts and
images, plus all default parts of Shopware, which can be moved, widened,
edited or hidden.

**Open:** Content › DMX4ALL Footer Editor

## Layouts

- Create, duplicate, name and delete any number of layouts, e.g. "Default",
  "Christmas", "Sale".
- Each layout applies to selected **sales channels** and **languages**
  (multiple selection, "All" = no restriction).
- New layouts start **inactive**. Per sales channel and language the shop uses
  the most specific active layout: specific sales channels before specific
  languages before "All". Activating a layout deactivates overlapping layouts
  of equal specificity.
- **Export** saves the open layout or all layouts as a JSON file (including
  arrangement and image addresses). **Import** creates new, inactive layouts
  from it; unknown sales channels or languages become "All", missing images
  are recreated from their address.

## Areas and elements

- Add areas ("Add area", up to 24), rearrange them by dragging their title and
  choose each area's **width** (1–12 columns or full width).
- Add elements with "+ Text" / "+ Image", move them by drag and drop, edit
  them by double-click or pencil. Removed elements can be restored for a few
  seconds.
- **Texts**, alt texts and links are maintained per language; if a
  translation is missing, the shop shows the default language.
- **Images**: upload or choose from the media library, with link, size (width
  in px or %, height in px) and alignment.

## Design per area

The colour swatch in each area header (also for default columns in the row)
opens the design dialog with live preview: background colour, padding, border
width/style/colour, corner radius; text colour, font size and weight, line
height, alignment, heading colour; link colour, hover colour and underline.
Empty fields keep the theme look. Each area is styled on its own.

## Shopware default parts

With the position "Next to default columns" the grid also contains:

- service hotline and every footer navigation column,
- payment logos, shipping logos, service menu, VAT notice and copyright
  (at their default position below the column row at first, optionally in the
  row).

Every part can be moved, widened and hidden. Its content can stay ("Content
from Shopware"), be extended ("Shopware + own elements") or be replaced ("Own
elements only"). Hotline and navigation columns can get their own headline per
language.

## Arrangement

Card **Arrangement in the footer** with desktop preview:

| Setting                  | Default                 |
|--------------------------|-------------------------|
| Show custom footer       | on                      |
| Position                 | Next to default columns |
| Columns on desktop       | 4                       |
| Columns on tablet        | 2                       |
| Columns on smartphone    | 1                       |
| Hide empty areas         | off                     |

Values apply per sales channel; a sales channel only stores its differences
from "All". Everything is set in the Footer Editor; the page under Settings ›
Extensions only shows info, support and help. Other positions: replace, above or below the default columns.

## Saving

- "Save" stores layout and arrangement and then clears the shop cache.
- "Auto-save": off, 3, 5 (default), 10, 30 or 60 seconds after the last
  change; remembered per browser. The status is shown next to the version.

## Fallbacks

- No matching active layout, plugin off or an error: the shop shows the normal
  Shopware footer.
- Missing translation: default language, otherwise the first available one.
- "Own elements only" without visible content: the shop shows the Shopware
  content.
- Deleted images are skipped; empty or invalid design values keep the theme.
- Deleted sales channels or languages are marked in the editor and can be
  removed with one click; a layout assigned only to deleted entries has no
  effect in the shop and is shown as such.

## Permissions

Settings › Users & permissions › Roles lists **DMX4ALL Footer Editor** under
"Content": view (open, view and export), edit (change and save areas,
elements, design and arrangement), create (new, duplicate, import) and delete.
Without "edit" the editor shows a notice and locks all inputs. Administrators
have all permissions.

## Technical notes

- Table `dmx4all_footer_tool_layout` (name, status, sales channels,
  languages, layout as JSON)
- Twig function `dmx4all_footer_tool()`, footer template blocks are extended;
  storefront CSS is inline, no theme compile needed
- Admin JS without Node/npm build; texts in
  `src/Resources/app/administration/src/snippet/` (German/English), embedded
  into the admin asset by `sync-admin.sh`
- Storefront texts in `src/Resources/snippet/`

## Development

```bash
./bump.sh patch "What changed"   # bump version, changelog, admin asset
./pack.sh                        # build/Dmx4allFooterTool-<version>.zip
```

After installation: `bin/console assets:install` and `bin/console cache:clear`.

## Licence

MIT, see `LICENSE.md`.
