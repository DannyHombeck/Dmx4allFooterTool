<?php declare(strict_types=1);

namespace Dmx4allFooterTool\Core\Content\Layout;

use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityIdTrait;

class LayoutEntity extends Entity
{
    use EntityIdTrait;

    protected ?string $name = null;

    protected bool $active = true;

    /**
     * @var list<string>|null
     */
    protected ?array $salesChannelIds = null;

    /**
     * @var list<string>|null
     */
    protected ?array $languageIds = null;

    protected ?string $salesChannelId = null;

    protected ?string $languageId = null;

    /**
     * @var array<string, mixed>|null
     */
    protected ?array $layout = null;

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(?string $name): void
    {
        $this->name = $name;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): void
    {
        $this->active = $active;
    }

    /**
     * @return list<string>|null
     */
    public function getSalesChannelIds(): ?array
    {
        return $this->salesChannelIds;
    }

    /**
     * @param list<string>|null $salesChannelIds
     */
    public function setSalesChannelIds(?array $salesChannelIds): void
    {
        $this->salesChannelIds = $salesChannelIds;
    }

    /**
     * @return list<string>|null
     */
    public function getLanguageIds(): ?array
    {
        return $this->languageIds;
    }

    /**
     * @param list<string>|null $languageIds
     */
    public function setLanguageIds(?array $languageIds): void
    {
        $this->languageIds = $languageIds;
    }

    public function getSalesChannelId(): ?string
    {
        return $this->salesChannelId;
    }

    public function setSalesChannelId(?string $salesChannelId): void
    {
        $this->salesChannelId = $salesChannelId;
    }

    public function getLanguageId(): ?string
    {
        return $this->languageId;
    }

    public function setLanguageId(?string $languageId): void
    {
        $this->languageId = $languageId;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getLayout(): ?array
    {
        return $this->layout;
    }

    /**
     * @param array<string, mixed>|null $layout
     */
    public function setLayout(?array $layout): void
    {
        $this->layout = $layout;
    }
}
