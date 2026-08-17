import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Small round check button used on task rows. */
export const TaskCheck = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { checked?: boolean }
>(({ className, checked, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="checkbox"
    aria-checked={checked}
    className={cn(
      'grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border transition-colors',
      checked
        ? 'border-[#34d399] bg-[#34d399] text-[#0d0f14]'
        : 'border-[#39424f] bg-transparent hover:border-[#8b93a4]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c14]',
      className,
    )}
    {...props}
  >
    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
  </button>
));
TaskCheck.displayName = 'TaskCheck';
