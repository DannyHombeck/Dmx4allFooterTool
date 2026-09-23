<?php declare(strict_types=1);

namespace Dmx4allFooterTool\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

/**
 * Ein Layout kann fuer mehrere Verkaufskanaele und Sprachen gelten.
 * Die Listen liegen als JSON vor (leer/NULL = alle); die bisherigen
 * Einzelwerte werden uebernommen.
 */
class Migration1790005500AddLayoutScopeLists extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1790005500;
    }

    public function update(Connection $connection): void
    {
        if (!$this->hasColumn($connection, 'sales_channel_ids')) {
            $connection->executeStatement(
                'ALTER TABLE `dmx4all_footer_tool_layout` ADD COLUMN `sales_channel_ids` JSON NULL AFTER `language_id`'
            );
            $connection->executeStatement(
                'UPDATE `dmx4all_footer_tool_layout`
                    SET `sales_channel_ids` = JSON_ARRAY(LOWER(HEX(`sales_channel_id`)))
                  WHERE `sales_channel_id` IS NOT NULL'
            );
        }

        if (!$this->hasColumn($connection, 'language_ids')) {
            $connection->executeStatement(
                'ALTER TABLE `dmx4all_footer_tool_layout` ADD COLUMN `language_ids` JSON NULL AFTER `sales_channel_ids`'
            );
            $connection->executeStatement(
                'UPDATE `dmx4all_footer_tool_layout`
                    SET `language_ids` = JSON_ARRAY(LOWER(HEX(`language_id`)))
                  WHERE `language_id` IS NOT NULL'
            );
        }
    }

    public function updateDestructive(Connection $connection): void
    {
    }

    private function hasColumn(Connection $connection, string $column): bool
    {
        return (int) $connection->fetchOne(
            'SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = :table
                AND COLUMN_NAME = :column',
            ['table' => 'dmx4all_footer_tool_layout', 'column' => $column]
        ) > 0;
    }
}
