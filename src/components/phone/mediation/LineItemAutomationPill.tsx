import { AlertTriangle, Check } from 'lucide-react';
import type { AutomationStatus } from '../../../types/automationStatus';
import { getAutomationPillConfig } from '../../../types/automationStatus';

interface LineItemAutomationPillProps {
  status: AutomationStatus;
  className?: string;
}

export function LineItemAutomationPill({ status, className = '' }: LineItemAutomationPillProps) {
  const config = getAutomationPillConfig(status);
  if (!config) return null;

  const Icon = status === 'high' ? Check : AlertTriangle;

  return (
    <span
      className={`mt-0.5 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8px] font-medium ${config.className} ${className}`}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
