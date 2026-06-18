import { Signal, Wifi, Battery } from 'lucide-react';
import type { ReactNode } from 'react';

interface PhoneChromeProps {
  children: ReactNode;
  borderGlow?: string;
  headerRight?: ReactNode;
}

export function PhoneChrome({
  children,
  borderGlow = 'border-surface-border',
  headerRight,
}: PhoneChromeProps) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-[40px] border-[3px] bg-[#0a0a0c] p-3 shadow-xl transition-shadow duration-500 ${borderGlow}`}
      style={{ width: 320, height: 640 }}
    >
      <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

      <div className="flex h-full flex-col overflow-hidden rounded-[32px] bg-white">
        <div className="flex shrink-0 items-center justify-between bg-gray-50 px-5 pb-1 pt-8 text-[10px] text-gray-600">
          <span className="font-medium">9:41</span>
          <div className="flex items-center gap-1">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <Battery className="h-3 w-3" />
          </div>
        </div>

        {headerRight !== undefined && (
          <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3">
            {headerRight}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

        <div className="flex shrink-0 justify-center bg-gray-50 py-2">
          <div className="h-1 w-24 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  );
}
