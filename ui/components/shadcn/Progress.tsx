'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

import { cn } from '@/utils/shadcn';

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  barClassName?: string;
};

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value, barClassName, ...props }, ref) => (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn('relative h-3 w-full overflow-hidden rounded-full bg-[#888]', className)}
      {...props}>
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full w-full flex-1 bg-gradient-to-r from-[#fdff9d] to-[#f6a522] transition-all',
          barClassName
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
