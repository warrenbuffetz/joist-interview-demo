import type { CatalogItem } from '../../../data/catalogData';
import type { AutomationStatus } from '../../../types/automationStatus';
import { isLaborSku } from '../../../utils/laborTime';
import { LaborLineItemCard } from './LaborLineItemCard';
import { PhysicalLineItemCard } from './PhysicalLineItemCard';

interface MediationLineItemCardProps {
  item: CatalogItem;
  isOn: boolean;
  quantity: number;
  laborMinutes: number;
  crewSize: number;
  automationStatus: AutomationStatus;
  onToggle: () => void;
  onRemove: () => void;
  onAdjustQty: (delta: number) => void;
  onDecreaseOrRemove: () => void;
  onLaborMinutesChange: (minutes: number) => void;
  onCrewSizeChange: (crewSize: number) => void;
  onUserVerify: () => void;
}

export function MediationLineItemCard({
  item,
  isOn,
  quantity,
  laborMinutes,
  crewSize,
  automationStatus,
  onToggle,
  onRemove,
  onAdjustQty,
  onDecreaseOrRemove,
  onLaborMinutesChange,
  onCrewSizeChange,
  onUserVerify,
}: MediationLineItemCardProps) {
  if (isLaborSku(item.sku)) {
    return (
      <LaborLineItemCard
        item={item}
        isOn={isOn}
        minutes={laborMinutes}
        crewSize={crewSize}
        automationStatus={automationStatus}
        onToggle={onToggle}
        onRemove={onRemove}
        onMinutesChange={onLaborMinutesChange}
        onCrewSizeChange={onCrewSizeChange}
        onUserVerify={onUserVerify}
      />
    );
  }

  return (
    <PhysicalLineItemCard
      item={item}
      isOn={isOn}
      quantity={quantity}
      automationStatus={automationStatus}
      onToggle={onToggle}
      onRemove={onRemove}
      onAdjustQty={onAdjustQty}
      onDecreaseOrRemove={onDecreaseOrRemove}
      onUserVerify={onUserVerify}
    />
  );
}
