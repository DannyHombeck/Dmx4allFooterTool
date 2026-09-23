<?php declare(strict_types=1);

namespace Dmx4allFooterTool\Twig;

use Dmx4allFooterTool\Service\LayoutService;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Stellt dmx4all_footer_tool() in Twig bereit.
 *
 * Der Footer wird in 6.7 per ESI als eigener Request gerendert. Der
 * SalesChannelContext wird deshalb aus dem aktuellen Request gelesen und
 * nicht aus einer Template-Variable, deren Name sich aendern koennte.
 */
class FooterToolExtension extends AbstractExtension
{
    /**
     * Ergebnis je Request, weil die Funktion im Footer-Template an zwei
     * Stellen aufgerufen wird.
     *
     * @var \WeakMap<Request, array<string, mixed>|null>
     */
    private \WeakMap $cache;

    public function __construct(
        private readonly LayoutService $layoutService,
        private readonly RequestStack $requestStack
    ) {
        $this->cache = new \WeakMap();
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('dmx4all_footer_tool', $this->getFooter(...)),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getFooter(): ?array
    {
        $request = $this->requestStack->getCurrentRequest();

        if ($request === null) {
            return null;
        }

        if ($this->cache->offsetExists($request)) {
            return $this->cache[$request];
        }

        $context = $request->attributes->get(PlatformRequest::ATTRIBUTE_SALES_CHANNEL_CONTEXT_OBJECT);
        $result = null;

        if ($context instanceof SalesChannelContext) {
            try {
                $result = $this->layoutService->getFooter($context);
            } catch (\Throwable) {
                // Ein Fehler im eigenen Footer darf nie die ganze Seite kosten.
                $result = null;
            }
        }

        $this->cache[$request] = $result;

        return $result;
    }
}
