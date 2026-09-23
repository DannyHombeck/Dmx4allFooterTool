<?php declare(strict_types=1);

namespace Dmx4allFooterTool\Migration;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

class Migration1790003644CreateLayoutTable extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1790003644;
    }

    public function update(Connection $connection): void
    {
        $connection->executeStatement(<<<SQL
            CREATE TABLE IF NOT EXISTS `dmx4all_footer_tool_layout` (
                `id`               BINARY(16)  NOT NULL,
                `sales_channel_id` BINARY(16)  NULL,
                `language_id`      BINARY(16)  NULL,
                `layout`           JSON        NULL,
                `created_at`       DATETIME(3) NOT NULL,
                `updated_at`       DATETIME(3) NULL,
                PRIMARY KEY (`id`),
                KEY `idx.dmx4all_footer_tool_layout.lookup` (`sales_channel_id`, `language_id`),
                CONSTRAINT `json.dmx4all_footer_tool_layout.layout` CHECK (JSON_VALID(`layout`)),
                CONSTRAINT `fk.dmx4all_footer_tool_layout.sales_channel_id` FOREIGN KEY (`sales_channel_id`)
                    REFERENCES `sales_channel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT `fk.dmx4all_footer_tool_layout.language_id` FOREIGN KEY (`language_id`)
                    REFERENCES `language` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        SQL);
    }

    public function updateDestructive(Connection $connection): void
    {
        // Bewusst leer: das Aufräumen erledigt die uninstall()-Routine der Plugin-Klasse.
    }
}
