import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-[10px] border border-[#262c38] bg-[#0d0f14] px-[10px] py-2',
        'text-[13.5px] text-[#e6e9ef] placeholder:text-[#8b93a4]',
        'transition-colors focus-visible:outline-none focus-visible:border-[#7a5c14]',
        'focus-visible:ring-2 focus-visible:ring-[#7a5c14]/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
