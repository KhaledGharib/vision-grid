import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#1b2029] text-[#8b93a4] border border-[#262c38]',
        accent: 'bg-[rgba(240,180,41,.13)] text-[#f0b429] border border-transparent',
        success: 'bg-[rgba(52,211,153,.12)] text-[#34d399] border border-transparent',
        danger: 'bg-[rgba(248,113,113,.1)] text-[#f87171] border border-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
