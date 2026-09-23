<?php declare(strict_types=1);

namespace Dmx4allFooterTool\Core\Content\Layout;

use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\BoolField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\FkField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\ApiAware;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\PrimaryKey;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\IdField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\JsonField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\StringField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;
use Shopware\Core\System\Language\LanguageDefinition;
use Shopware\Core\System\SalesChannel\SalesChannelDefinition;

/**
 * Ein Footer-Layout mit Namen. Es kann mehrere Layouts geben; im Shop gilt je
 * Verkaufskanal/Sprache das aktive. Verkaufskanal und Sprache sind optional:
 * leer bedeutet "gilt fuer alle". Die Storefront nimmt jeweils den
 * genauesten Treffer (siehe LayoutService::findLayout()).
 */
class LayoutDefinition extends EntityDefinition
{
    public const ENTITY_NAME = 'dmx4all_footer_tool_layout';

    public function getEntityName(): string
    {
        return self::ENTITY_NAME;
    }

    public function getEntityClass(): string
    {
        return LayoutEntity::class;
    }

    public function getCollectionClass(): string
    {
        return LayoutCollection::class;
    }

    protected function defineFields(): FieldCollection
    {
        return new FieldCollection([
            (new IdField('id', 'id'))->addFlags(new ApiAware(), new PrimaryKey(), new Required()),
            (new StringField('name', 'name'))->addFlags(new ApiAware()),
            (new BoolField('active', 'active'))->addFlags(new ApiAware()),
            (new FkField('sales_channel_id', 'salesChannelId', SalesChannelDefinition::class))->addFlags(new ApiAware()),
            (new FkField('language_id', 'languageId', LanguageDefinition::class))->addFlags(new ApiAware()),
            // Listen der IDs, fuer die das Layout gilt (NULL/leer = alle)
            (new JsonField('sales_channel_ids', 'salesChannelIds'))->addFlags(new ApiAware()),
            (new JsonField('language_ids', 'languageIds'))->addFlags(new ApiAware()),
            (new JsonField('layout', 'layout'))->addFlags(new ApiAware()),
        ]);
    }
}
