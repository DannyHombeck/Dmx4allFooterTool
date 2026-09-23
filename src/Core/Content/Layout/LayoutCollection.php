<?php declare(strict_types=1);

namespace Dmx4allFooterTool\Core\Content\Layout;

use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;

/**
 * @extends EntityCollection<LayoutEntity>
 */
class LayoutCollection extends EntityCollection
{
    protected function getExpectedClass(): string
    {
        return LayoutEntity::class;
    }
}
