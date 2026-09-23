<?php declare(strict_types=1);

namespace Dmx4allFooterTool\Service;

use Doctrine\DBAL\Connection;
use Shopware\Core\Content\Media\MediaCollection;
use Shopware\Core\Defaults;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Uuid\Uuid;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Shopware\Core\System\SystemConfig\SystemConfigService;

/**
 * Liefert das Footer-Layout fuer die Storefront.
 *
 * Aufbau des gespeicherten JSON (wird vom Admin-Modul geschrieben):
 *
 *   {
 *     "areas": [
 *       { "items": [
 *           { "id": "...", "type": "text",  "content": { "<languageId>": "<p>...</p>" } },
 *           { "id": "...", "type": "image", "mediaId": "...",
 *             "alt": { "<languageId>": "..." }, "link": { "<languageId>": "..." },
 *             "newTab": false, "width": 200, "widthUnit": "px", "height": null,
 *             "align": "left" }
 *       ] },
 *       ... beliebig viele Bereiche (hoechstens MAX_AREAS)
 *     ]
 *   }
 */
class LayoutService
{
    public const MAX_AREAS = 24;

    public const MAX_COLUMNS = 12;

    private const CONFIG = 'Dmx4allFooterTool.config.';

    private const PLACEMENTS = ['inline', 'replace', 'before', 'after'];

    private const ALIGNMENTS = ['left', 'center', 'right'];

    private const ORDERS = ['start', 'between', 'end'];

    private const CORE_MODES = ['default', 'append', 'replace'];

    /** Erlaubte Farbangaben: #rgb(a), #rrggbb(aa), rgb(), rgba(), transparent */
    private const COLOR_PATTERN = '/^(#[0-9a-fA-F]{3,4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)|transparent)$/';

    /**
     * Design-Felder: Typ und Grenzen bzw. erlaubte Werte.
     *
     * @var array<string, array{0: string, 1?: mixed, 2?: mixed}>
     */
    private const DESIGN_FIELDS = [
        'backgroundColor' => ['color'],
        'padding' => ['px', 0, 80],
        'borderWidth' => ['px', 0, 20],
        'borderStyle' => ['select', ['solid', 'dashed', 'dotted', 'double']],
        'borderColor' => ['color'],
        'borderRadius' => ['px', 0, 60],
        'textColor' => ['color'],
        'fontSize' => ['px', 8, 40],
        'fontWeight' => ['select', ['300', '400', '500', '600', '700', '800']],
        'lineHeight' => ['number', 0.8, 3],
        'textAlign' => ['select', ['left', 'center', 'right', 'justify']],
        'headingColor' => ['color'],
        'linkColor' => ['color'],
        'linkHoverColor' => ['color'],
        'linkDecoration' => ['select', ['none', 'underline']],
        'linkHoverDecoration' => ['select', ['none', 'underline']],
    ];

    /** Teile, die bei Shopware unter der Spaltenzeile stehen */
    private const OUTSIDE_KEYS = ['payment', 'shipping', 'servicemenu', 'vat', 'copyright'];

    /** Fruehere Sammel-Eintraege (bis 1.9.x) und ihre Einzelteile */
    private const LEGACY_PARTS = [
        'logos' => ['payment', 'shipping'],
        'bottom' => ['servicemenu', 'vat', 'copyright'],
    ];

    /**
     * @param EntityRepository<MediaCollection> $mediaRepository
     */
    public function __construct(
        private readonly Connection $connection,
        private readonly SystemConfigService $systemConfigService,
        private readonly EntityRepository $mediaRepository
    ) {
    }

    /**
     * @return array<string, mixed>|null null = Standard-Footer unveraendert lassen
     */
    public function getFooter(SalesChannelContext $salesChannelContext): ?array
    {
        $salesChannelId = $salesChannelContext->getSalesChannelId();

        if (!$this->systemConfigService->getBool(self::CONFIG . 'active', $salesChannelId)) {
            return null;
        }

        $languageId = $salesChannelContext->getContext()->getLanguageId();
        $raw = $this->findLayout($salesChannelId, $languageId);

        if ($raw === null) {
            return null;
        }

        $areas = $this->normalizeAreas($raw, $languageId);
        $core = $this->collectCore($raw, $areas, $salesChannelId, $languageId);
        $hasContent = false;

        foreach ($areas as $area) {
            if ($area['items'] !== []) {
                $hasContent = true;
                break;
            }
        }

        // Auch ein Layout, das nur Standard-Spalten anordnet oder aendert, wird angewendet
        foreach ((array) ($raw['areas'] ?? []) as $entry) {
            if (\is_array($entry) && ($entry['type'] ?? null) === 'core') {
                $hasContent = true;
                break;
            }
        }

        if (!$hasContent) {
            return null;
        }

        $areas = $this->attachMedia($areas, $salesChannelContext);
        $core = $this->attachMedia($core, $salesChannelContext);

        // Rueckfall: "Nur eigene Elemente" ohne (sichtbare) Elemente - etwa weil die
        // Sprache keinen Text hat oder das Bild geloescht wurde - zeigt wieder den
        // Inhalt von Shopware statt einer leeren Spalte.
        foreach ($core as $key => $entry) {
            if (($entry['mode'] ?? 'default') === 'replace' && ($entry['items'] ?? []) === []) {
                $core[$key]['mode'] = 'default';
            }
        }

        $placement = (string) $this->systemConfigService->getString(self::CONFIG . 'placement', $salesChannelId);

        $columns = [
            'Desktop' => $this->clampColumns($this->systemConfigService->getInt(self::CONFIG . 'columnsDesktop', $salesChannelId), 4),
            'Tablet' => $this->clampColumns($this->systemConfigService->getInt(self::CONFIG . 'columnsTablet', $salesChannelId), 2),
            'Mobile' => $this->clampColumns($this->systemConfigService->getInt(self::CONFIG . 'columnsMobile', $salesChannelId), 1),
        ];

        // Breite je Geraet: "full" = alle Spalten, sonst hoechstens so viele wie vorhanden
        foreach ($areas as $a => $area) {
            foreach ($columns as $device => $count) {
                $areas[$a]['span' . $device] = $area['span'] === 'full' ? $count : min((int) $area['span'], $count);
            }
        }

        // CSS order braucht ganze Zahlen; Einzelteile alter Eintraege haben Zwischenwerte (x.1, x.2)
        foreach ($areas as $a => $area) {
            $areas[$a]['order'] = (int) round($area['order'] * 10);
        }

        foreach ($core as $key => $entry) {
            $core[$key]['order'] = (int) round($entry['order'] * 10);
        }

        foreach ($core as $key => $entry) {
            foreach ($columns as $device => $count) {
                $core[$key]['span' . $device] = $entry['span'] === 'full' ? $count : min((int) $entry['span'], $count);
            }
        }

        $designCss = '';

        foreach ($areas as $area) {
            $designCss .= $this->designCss($area['designClass'], $area['design']);
        }

        foreach ($core as $entry) {
            if (isset($entry['designClass'])) {
                $designCss .= $this->designCss($entry['designClass'], $entry['design'] ?? []);
            }
        }

        return [
            'designCss' => $designCss,
            'placement' => \in_array($placement, self::PLACEMENTS, true) ? $placement : 'inline',
            'columnsDesktop' => $columns['Desktop'],
            'columnsTablet' => $columns['Tablet'],
            'columnsMobile' => $columns['Mobile'],
            'showHotline' => $this->boolWithDefault('showHotline', $salesChannelId, true),
            'showNavigation' => $this->boolWithDefault('showNavigation', $salesChannelId, true),
            'hideEmptyAreas' => $this->systemConfigService->getBool(self::CONFIG . 'hideEmptyAreas', $salesChannelId),
            'areas' => $areas,
            'core' => $core,
        ];
    }

    /**
     * Nur aktive Layouts. Genauester Treffer gewinnt:
     *   Verkaufskanal + Sprache > Verkaufskanal > Sprache > Standard
     * Bei Gleichstand das zuletzt geaenderte.
     *
     * @return array<string, mixed>|null
     */
    private function findLayout(string $salesChannelId, string $languageId): ?array
    {
        $rows = $this->connection->fetchAllAssociative(
            'SELECT LOWER(HEX(`sales_channel_id`)) AS sc, LOWER(HEX(`language_id`)) AS lang,
                    `sales_channel_ids`, `language_ids`, `layout`
               FROM `dmx4all_footer_tool_layout`
              WHERE `active` = 1
              ORDER BY COALESCE(`updated_at`, `created_at`) DESC'
        );

        $salesChannelId = strtolower($salesChannelId);
        $languageId = strtolower($languageId);
        $best = null;
        $bestScore = -1;

        foreach ($rows as $row) {
            // Listen (ab 1.14), sonst die frueheren Einzelwerte; leer = alle
            $channels = $this->idList($row['sales_channel_ids'], $row['sc']);
            $languages = $this->idList($row['language_ids'], $row['lang']);

            if ($channels !== [] && !\in_array($salesChannelId, $channels, true)) {
                continue;
            }

            if ($languages !== [] && !\in_array($languageId, $languages, true)) {
                continue;
            }

            $score = ($channels !== [] ? 2 : 0) + ($languages !== [] ? 1 : 0);

            // Zeilen sind nach Aenderung absteigend sortiert: bei Gleichstand gewinnt das neueste
            if ($score > $bestScore) {
                $best = $row;
                $bestScore = $score;
            }
        }

        if ($best === null || !\is_string($best['layout'])) {
            return null;
        }

        $decoded = json_decode($best['layout'], true);

        return \is_array($decoded) ? $decoded : null;
    }

    /**
     * @return list<string>
     */
    private function idList(mixed $json, mixed $single): array
    {
        if (\is_string($json) && $json !== '') {
            $decoded = json_decode($json, true);

            if (\is_array($decoded) && $decoded !== []) {
                return array_values(array_filter(array_map(
                    static fn ($id): string => strtolower((string) $id),
                    $decoded
                ), static fn (string $id): bool => Uuid::isValid($id)));
            }
        }

        return \is_string($single) && $single !== '' ? [strtolower($single)] : [];
    }

    /**
     * @param array<string, mixed> $raw
     *
     * @return list<array{index: int, items: list<array<string, mixed>>}>
     */
    private function normalizeAreas(array $raw, string $languageId): array
    {
        $source = isset($raw['areas']) && \is_array($raw['areas']) ? array_values($raw['areas']) : [];
        $areas = [];
        $ownCount = 0;

        for ($i = 0, $count = \count($source); $i < $count; ++$i) {
            // Standard-Spalten (Hotline, Navigation) sammelt collectCore()
            if (($source[$i]['type'] ?? null) === 'core') {
                continue;
            }

            if (++$ownCount > self::MAX_AREAS) {
                break;
            }

            $items = $this->normalizeItems($source[$i]['items'] ?? [], $languageId);

            $areas[] = [
                'index' => $ownCount,
                'order' => $i,
                'design' => $this->normalizeDesign($source[$i]['design'] ?? null),
                'designClass' => 'dft-d-' . $this->classSuffix((string) ($source[$i]['id'] ?? ('area' . $ownCount))),
                'span' => $this->normalizeSpan($source[$i]['span'] ?? 1),
                'items' => $items,
            ];
        }

        return $areas;
    }

    /**
     * Text- und Bild-Elemente eines Bereichs (oder einer Standard-Spalte)
     * fuer die aktuelle Sprache aufbereiten; leere Elemente fallen weg.
     *
     * @return list<array<string, mixed>>
     */
    private function normalizeItems(mixed $rawItems, string $languageId): array
    {
        $items = [];

        if (!\is_array($rawItems)) {
            return $items;
        }

        foreach ($rawItems as $item) {
            if (!\is_array($item)) {
                continue;
            }

            $type = $item['type'] ?? null;

            if ($type === 'text') {
                $content = trim($this->translate($item['content'] ?? '', $languageId));

                if ($content !== '') {
                    $items[] = ['type' => 'text', 'content' => $content];
                }

                continue;
            }

            if ($type === 'image') {
                $mediaId = (string) ($item['mediaId'] ?? '');

                if (!Uuid::isValid($mediaId)) {
                    continue;
                }

                $align = (string) ($item['align'] ?? 'left');
                $widthUnit = ($item['widthUnit'] ?? 'px') === '%' ? '%' : 'px';
                // Bis 1.10.x gab es nur maxWidth (Pixel)
                $width = (int) ($item['width'] ?? $item['maxWidth'] ?? 0);
                $height = (int) ($item['height'] ?? 0);

                $items[] = [
                    'type' => 'image',
                    'mediaId' => strtolower($mediaId),
                    'alt' => trim($this->translate($item['alt'] ?? '', $languageId)),
                    'link' => $this->sanitizeLink($this->translate($item['link'] ?? '', $languageId)),
                    'newTab' => (bool) ($item['newTab'] ?? false),
                    'width' => $width > 0 ? min($width, $widthUnit === '%' ? 100 : 2000) : null,
                    'widthUnit' => $widthUnit,
                    'height' => $height > 0 ? min($height, 2000) : null,
                    'align' => \in_array($align, self::ALIGNMENTS, true) ? $align : 'left',
                ];
            }
        }

        return $items;
    }

    /**
     * Haengt die Media-Entities an die Bild-Elemente. Bilder, deren Medium
     * inzwischen geloescht wurde, fallen dabei still heraus.
     *
     * Funktioniert fuer die Liste der Bereiche wie fuer die Standard-Spalten
     * (Schluessel bleiben erhalten).
     *
     * @param array<array-key, array<string, mixed>> $areas
     *
     * @return array<array-key, array<string, mixed>>
     */
    private function attachMedia(array $areas, SalesChannelContext $salesChannelContext): array
    {
        $ids = [];

        foreach ($areas as $area) {
            foreach ($area['items'] as $item) {
                if ($item['type'] === 'image') {
                    $ids[$item['mediaId']] = true;
                }
            }
        }

        if ($ids === []) {
            return $areas;
        }

        $media = $this->mediaRepository
            ->search(new Criteria(array_keys($ids)), $salesChannelContext->getContext())
            ->getEntities();

        foreach ($areas as $a => $area) {
            $items = [];

            foreach ($area['items'] as $item) {
                if ($item['type'] === 'image') {
                    $entity = $media->get($item['mediaId']);

                    if ($entity === null) {
                        continue;
                    }

                    $item['media'] = $entity;
                }

                $items[] = $item;
            }

            $areas[$a]['items'] = $items;
        }

        return $areas;
    }

    /**
     * Uebersetzbare Felder sind { languageId: wert }. Reihenfolge:
     * aktuelle Sprache, Systemsprache, erster vorhandener Wert.
     * Ein einfacher String (Layouts vor 1.3.0) gilt fuer alle Sprachen.
     */
    private function translate(mixed $value, string $languageId): string
    {
        if (\is_string($value)) {
            return $value;
        }

        if (!\is_array($value)) {
            return '';
        }

        foreach ([strtolower($languageId), Defaults::LANGUAGE_SYSTEM] as $candidate) {
            if (isset($value[$candidate]) && \is_string($value[$candidate]) && trim($value[$candidate]) !== '') {
                return $value[$candidate];
            }
        }

        foreach ($value as $entry) {
            if (\is_string($entry) && trim($entry) !== '') {
                return $entry;
            }
        }

        return '';
    }

    /**
     * Nur http(s), relative Pfade, mailto: und tel: zulassen.
     */
    private function sanitizeLink(string $link): string
    {
        $link = trim($link);

        if ($link === '') {
            return '';
        }

        if (preg_match('#^(https?://|/|mailto:|tel:|\#)#i', $link) === 1) {
            return $link;
        }

        return '';
    }

    /**
     * Standard-Spalten von Shopware mit Position und Breite:
     *   'hotline', 'nav-1', 'nav-2', ... und 'nav' fuer alle weiteren
     *   Navigationsspalten, dazu 'logos' (Zahlungs-/Versandlogos) und
     *   'bottom' (Fussleiste), die mit inRow in die Spaltenzeile wandern.
     *
     * Aeltere Layouts ohne solche Eintraege bekommen die Positionen aus den
     * frueheren Einstellungen (inlineOrder, showHotline, showNavigation).
     *
     * @param array<string, mixed>                  $raw
     * @param list<array<string, mixed>>            $areas eigene Bereiche (order wird ggf. angepasst)
     *
     * @return array<string, array<string, mixed>>
     */
    private function collectCore(array $raw, array &$areas, string $salesChannelId, string $languageId): array
    {
        $source = isset($raw['areas']) && \is_array($raw['areas']) ? array_values($raw['areas']) : [];
        $core = [];

        foreach ($source as $position => $entry) {
            if (($entry['type'] ?? null) !== 'core' || !\is_string($entry['key'] ?? null)) {
                continue;
            }

            $key = $entry['key'];

            if (!\in_array($key, ['hotline', 'nav', 'logos', 'bottom', ...self::OUTSIDE_KEYS], true) && preg_match('/^nav-\d+$/', $key) !== 1) {
                continue;
            }

            $mode = (string) ($entry['mode'] ?? 'default');
            $mode = \in_array($mode, self::CORE_MODES, true) ? $mode : 'default';

            $core[$key] = [
                // default = Inhalt von Shopware, append = Shopware + eigene Elemente, replace = nur eigene Elemente
                'mode' => $mode,
                'items' => $mode === 'default' ? [] : $this->normalizeItems($entry['items'] ?? [], $languageId),
                // Eigene Ueberschrift (nur Hotline und Navigationsspalten), leer = Standard
                'headline' => trim(strip_tags($this->translate($entry['headline'] ?? '', $languageId))),
                'design' => $this->normalizeDesign($entry['design'] ?? null),
                'designClass' => 'dft-d-core-' . $this->classSuffix($key),
                'order' => $position,
                'span' => $this->normalizeSpan($entry['span'] ?? 1),
                'hidden' => (bool) ($entry['hidden'] ?? false),
                // Nur Logos und Fussleiste: true = in der Spaltenzeile statt am Originalplatz
                'inRow' => \in_array($key, ['logos', 'bottom', ...self::OUTSIDE_KEYS], true) ? (bool) ($entry['inRow'] ?? false) : true,
            ];
        }

        if ($core !== []) {
            return $this->expandLegacyParts($core);
        }

        // Altes Layout: Reihenfolge wie frueher "zuerst / zwischen / zuletzt"
        $order = (string) $this->systemConfigService->getString(self::CONFIG . 'inlineOrder', $salesChannelId);
        $order = \in_array($order, self::ORDERS, true) ? $order : 'end';
        $ownCount = \count($areas);

        [$ownOffset, $hotlineOrder, $navOrder] = match ($order) {
            'start' => [0, $ownCount, $ownCount + 1],
            'between' => [1, 0, $ownCount + 1],
            default => [2, 0, 1],
        };

        foreach ($areas as $index => $area) {
            $areas[$index]['order'] = $index + $ownOffset;
        }

        return [
            'hotline' => [
                'mode' => 'default',
                'items' => [],
                'headline' => '',
                'order' => $hotlineOrder,
                'span' => 1,
                'hidden' => !$this->boolWithDefault('showHotline', $salesChannelId, true),
            ],
            'nav' => [
                'mode' => 'default',
                'items' => [],
                'headline' => '',
                'order' => $navOrder,
                'span' => 1,
                'hidden' => !$this->boolWithDefault('showNavigation', $salesChannelId, true),
            ],
        ];
    }

    /**
     * Layouts bis 1.9.x kennen "logos" und "bottom" als je einen Eintrag.
     * Daraus werden die Einzelteile mit denselben Einstellungen; eigene
     * Elemente landen beim Ersetzen im ersten, beim Ergaenzen im letzten Teil.
     *
     * @param array<string, array<string, mixed>> $core
     *
     * @return array<string, array<string, mixed>>
     */
    private function expandLegacyParts(array $core): array
    {
        foreach (self::LEGACY_PARTS as $old => $parts) {
            if (!isset($core[$old])) {
                continue;
            }

            $entry = $core[$old];
            unset($core[$old]);
            $last = \count($parts) - 1;

            foreach ($parts as $index => $part) {
                if (isset($core[$part])) {
                    continue;
                }

                $copy = $entry;
                $copy['order'] = $entry['order'] + ($index / 10);
                $copy['designClass'] = 'dft-d-core-' . $part;

                if ($entry['mode'] === 'replace') {
                    $copy['items'] = $index === 0 ? $entry['items'] : [];
                } elseif ($entry['mode'] === 'append') {
                    $copy['mode'] = $index === $last ? 'append' : 'default';
                    $copy['items'] = $index === $last ? $entry['items'] : [];
                }

                $core[$part] = $copy;
            }
        }

        return $core;
    }

    /**
     * Breite eines Bereichs: Anzahl Spalten (1-12) oder "full" fuer die
     * ganze Breite.
     */
    private function normalizeSpan(mixed $span): int|string
    {
        if ($span === 'full') {
            return 'full';
        }

        $span = (int) $span;

        return $span >= 1 ? min($span, self::MAX_COLUMNS) : 1;
    }

    /**
     * Nur gueltige Design-Werte behalten; alles andere faellt weg.
     *
     * @return array<string, string|int|float>
     */
    private function normalizeDesign(mixed $raw): array
    {
        $design = [];

        if (!\is_array($raw)) {
            return $design;
        }

        foreach (self::DESIGN_FIELDS as $key => $rule) {
            if (!isset($raw[$key]) || $raw[$key] === '') {
                continue;
            }

            $value = $raw[$key];

            switch ($rule[0]) {
                case 'color':
                    $value = trim((string) $value);

                    if (preg_match(self::COLOR_PATTERN, $value) === 1) {
                        $design[$key] = $value;
                    }

                    break;

                case 'px':
                    $design[$key] = (int) max($rule[1], min($rule[2], round((float) $value)));

                    break;

                case 'number':
                    $design[$key] = round(max($rule[1], min($rule[2], (float) $value)), 1);

                    break;

                default:
                    if (\in_array((string) $value, $rule[1], true)) {
                        $design[$key] = (string) $value;
                    }
            }
        }

        return $design;
    }

    /**
     * CSS fuer einen Bereich. Die Klasse steht am Bereich selbst; bei
     * Standard-Spalten an einer display:contents-Huelle, deshalb gelten die
     * Kasten-Werte dort fuer die innere .footer-column. Die doppelte Klasse
     * hebt die Spezifitaet ueber die Theme-Regeln des Footers.
     *
     * @param array<string, string|int|float> $d
     */
    private function designCss(string $class, array $d): string
    {
        if ($d === []) {
            return '';
        }

        $c = '.' . $class . '.' . $class;
        $box = [];

        if (isset($d['backgroundColor'])) {
            $box[] = 'background-color:' . $d['backgroundColor'];
        }

        if (isset($d['textColor'])) {
            $box[] = 'color:' . $d['textColor'];
        }

        if (isset($d['fontSize'])) {
            $box[] = 'font-size:' . $d['fontSize'] . 'px';
        }

        if (isset($d['fontWeight'])) {
            $box[] = 'font-weight:' . $d['fontWeight'];
        }

        if (isset($d['lineHeight'])) {
            $box[] = 'line-height:' . $d['lineHeight'];
        }

        if (isset($d['textAlign'])) {
            $box[] = 'text-align:' . $d['textAlign'];
        }

        if (isset($d['padding'])) {
            $box[] = 'padding:' . $d['padding'] . 'px';
        }

        if (isset($d['borderWidth'])) {
            $box[] = 'border:' . $d['borderWidth'] . 'px ' . ($d['borderStyle'] ?? 'solid') . ' ' . ($d['borderColor'] ?? 'currentColor');
        }

        if (isset($d['borderRadius'])) {
            $box[] = 'border-radius:' . $d['borderRadius'] . 'px';
        }

        $css = '';

        if ($box !== []) {
            $css .= $c . ':not(.dmx4all-footer-tool__core),' . $c . '.dmx4all-footer-tool__core>.footer-column{' . implode(';', $box) . '}';
        }

        // Theme-Texte im Footer setzen oft eigene Farben/Groessen: an die Bereichswerte binden
        $inherit = [];

        if (isset($d['textColor'])) {
            $inherit[] = 'color:inherit';
        }

        if (isset($d['fontSize'])) {
            $inherit[] = 'font-size:inherit';
        }

        if ($inherit !== []) {
            $css .= $c . ' :is(p,li,.footer-contact-hotline,.footer-contact-form,.footer-vat,.footer-copyright,.footer-service-menu-list){' . implode(';', $inherit) . '}';
        }

        if (isset($d['headingColor'])) {
            $css .= $c . ' :is(h1,h2,h3,h4,h5,h6,.footer-headline,.footer-column-headline,.footer-column-headline a){color:' . $d['headingColor'] . '}';
        }

        $link = [];

        if (isset($d['linkColor'])) {
            $link[] = 'color:' . $d['linkColor'];
        }

        if (isset($d['linkDecoration'])) {
            $link[] = 'text-decoration:' . $d['linkDecoration'];
        }

        if ($link !== []) {
            $css .= $c . ' a:not(.btn){' . implode(';', $link) . '}';
        }

        $hover = [];

        if (isset($d['linkHoverColor'])) {
            $hover[] = 'color:' . $d['linkHoverColor'];
        }

        if (isset($d['linkHoverDecoration'])) {
            $hover[] = 'text-decoration:' . $d['linkHoverDecoration'];
        }

        if ($hover !== []) {
            $css .= $c . ' a:not(.btn):hover,' . $c . ' a:not(.btn):focus{' . implode(';', $hover) . '}';
        }

        return $css;
    }

    /** Sicherer Teil eines CSS-Klassennamens */
    private function classSuffix(string $value): string
    {
        $suffix = preg_replace('/[^a-zA-Z0-9_-]/', '', $value) ?? '';

        return substr($suffix !== '' ? $suffix : md5($value), 0, 40);
    }

    private function boolWithDefault(string $key, string $salesChannelId, bool $default): bool
    {
        $value = $this->systemConfigService->get(self::CONFIG . $key, $salesChannelId);

        return $value === null ? $default : (bool) $value;
    }

    private function clampColumns(int $value, int $default): int
    {
        if ($value < 1) {
            return $default;
        }

        return min($value, self::MAX_COLUMNS);
    }
}
