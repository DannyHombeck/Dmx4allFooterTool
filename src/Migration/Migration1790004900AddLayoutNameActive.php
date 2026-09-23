<?php declare(strict_types=1);

namespace Dmx4allFooterTool\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

/**
 * Mehrere Layouts: jedes bekommt einen Namen und kann aktiv oder inaktiv sein.
 * Bestehende Layouts heissen "Standard" und bleiben aktiv.
 */
class Migration1790004900AddLayoutNameActive extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1790004900;
    }

    public function update(Connection $connection): void
    {
        if (!$this->hasColumn($connection, 'name')) {
            $connection->executeStatement(
                'ALTER TABLE `dmx4all_footer_tool_layout` ADD COLUMN `name` VARCHAR(255) NULL AFTER `id`'
            );
            $connection->executeStatement(
                'UPDATE `dmx4all_footer_tool_layout` SET `name` = :name WHERE `name` IS NULL',
                ['name' => 'Standard']
            );
        }

        if (!$this->hasColumn($connection, 'active')) {
            $connection->executeStatement(
                'ALTER TABLE `dmx4all_footer_tool_layout` ADD COLUMN `active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `name`'
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
