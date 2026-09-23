<?php declare(strict_types=1);

namespace Dmx4allFooterTool;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Plugin;
use Shopware\Core\Framework\Plugin\Context\UninstallContext;
use Shopware\Core\Framework\Plugin\Context\UpdateContext;

class Dmx4allFooterTool extends Plugin
{
    /**
     * Tabellen, die dieses Plugin anlegt. Beim Deinstallieren werden sie
     * in umgekehrter Reihenfolge entfernt (Fremdschlüssel zuerst).
     */
    private const PLUGIN_TABLES = [
        'dmx4all_footer_tool_layout',
    ];

    public function update(UpdateContext $updateContext): void
    {
        parent::update($updateContext);

        // Ab 1.1.0 ist "neben den Standard-Spalten" die Standard-Position.
        // Wer 1.0.0 mit der damaligen Vorgabe "ersetzen" installiert hat,
        // wird einmalig umgestellt.
        if (version_compare($updateContext->getCurrentPluginVersion(), '1.1.0', '<')) {
            $connection = $this->container?->get(Connection::class);

            if ($connection instanceof Connection) {
                $connection->executeStatement(
                    'UPDATE `system_config`
                        SET `configuration_value` = JSON_OBJECT(\'_value\', :value)
                      WHERE `configuration_key` = :key
                        AND JSON_UNQUOTE(JSON_EXTRACT(`configuration_value`, \'$._value\')) = :old',
                    [
                        'key' => 'Dmx4allFooterTool.config.placement',
                        'value' => 'inline',
                        'old' => 'replace',
                    ]
                );
            }
        }
    }

    /**
     * Entfernt beim Deinstallieren alle Spuren des Plugins,
     * sofern der Anwender die Daten nicht behalten möchte.
     */
    public function uninstall(UninstallContext $uninstallContext): void
    {
        parent::uninstall($uninstallContext);

        if ($uninstallContext->keepUserData()) {
            return;
        }

        $connection = $this->container?->get(Connection::class);

        if (!$connection instanceof Connection) {
            return;
        }

        // Migrationseintraege entfernt Shopware selbst (Plugin::removeMigrations)
        $this->removeTables($connection);
        $this->removeConfiguration($connection);
    }

    private function removeTables(Connection $connection): void
    {
        $connection->executeStatement('SET FOREIGN_KEY_CHECKS = 0');

        foreach (array_reverse(self::PLUGIN_TABLES) as $table) {
            $connection->executeStatement(sprintf('DROP TABLE IF EXISTS `%s`', $table));
        }

        $connection->executeStatement('SET FOREIGN_KEY_CHECKS = 1');
    }

    private function removeConfiguration(Connection $connection): void
    {
        $connection->executeStatement(
            'DELETE FROM `system_config` WHERE `configuration_key` LIKE :key',
            ['key' => 'Dmx4allFooterTool.config.%']
        );
    }
}
