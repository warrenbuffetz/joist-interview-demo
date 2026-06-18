import type { CatalogItem } from '../../../data/catalogData';
import { isLaborSku } from '../../../utils/laborTime';
import { LaborLineItemCard } from './LaborLineItemCard';
import { PhysicalLineItemCard } from './PhysicalLineItemCard';

interface MediationLineItemCardProps {
  item: CatalogItem;
  isOn: boolean;
  quantity: number;
  laborMinutes: number;
  crewSize: number;
  wasVoiceMatch: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onAdjustQty: (delta: number) => void;
  onDecreaseOrRemove: () => void;
  onLaborMinutesChange: (minutes: number) => void;
  onCrewSizeChange: (crewSize: number) => void;
}

export function MediationLineItemCard({
  item,
  isOn,
  quantity,
  laborMinutes,
  crewSize,
  wasVoiceMatch,
  onToggle,
  onRemove,
  onAdjustQty,
  onDecreaseOrRemove,
  onLaborMinutesChange,
  onCrewSizeChange,
}: MediationLineItemCardProps) {
  if (isLaborSku(item.sku)) {
    return (
      <LaborLineItemCard
        item={item}
        isOn={isOn}
        minutes={laborMinutes}
        crewSize={crewSize}
        wasVoiceMatch={wasVoiceMatch}
        onToggle={onToggle}
        onRemove={onRemove}
        onMinutesChange={onLaborMinutesChange}
        onCrewSizeChange={onCrewSizeChange}
      />
    );
  }

  return (
    <PhysicalLineItemCard
      item={item}
      isOn={isOn}
      quantity={quantity}
      wasVoiceMatch={wasVoiceMatch}
      onToggle={onToggle}
      onRemove={onRemove}
      onAdjustQty={onAdjustQty}
      onDecreaseOrRemove={onDecreaseOrRemove}
    />
  );
}
