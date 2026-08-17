import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // btn-reset opts this button out of the legacy `button {}` rules in index.css,
  // which would otherwise override the utility classes on specificity.
  "btn-reset inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5c14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0f14] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          'bg-[#1b2029] text-[#e6e9ef] border border-[#262c38] hover:bg-[#232a35] hover:border-[#39424f]',
        primary:
          'bg-[#f0b429] text-[#1a1400] border border-[#f0b429] font-semibold hover:bg-[#f7c53f]',
        ghost:
          'bg-transparent border border-transparent text-[#8b93a4] hover:bg-[#1b2029] hover:text-[#e6e9ef]',
        destructive:
          'bg-transparent border border-[rgba(248,113,113,.35)] text-[#f87171] hover:bg-[rgba(248,113,113,.12)]',
        success:
          'bg-[rgba(52,211,153,.08)] border border-[rgba(52,211,153,.35)] text-[#34d399] hover:bg-[rgba(52,211,153,.18)]',
      },
      size: {
        default: 'h-9 px-3 py-[7px]',
        sm: 'h-8 px-[11px] text-[12.5px]',
        lg: 'h-10 px-5 text-[14.5px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
