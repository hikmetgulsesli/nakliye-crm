<<<<<<< HEAD
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"
=======
import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/lib/utils';
>>>>>>> origin/feature/crm-core-modules

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
<<<<<<< HEAD
    { className, orientation = "horizontal", decorative = true, ...props },
=======
    { className, orientation = 'horizontal', decorative = true, ...props },
>>>>>>> origin/feature/crm-core-modules
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
<<<<<<< HEAD
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
=======
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
>>>>>>> origin/feature/crm-core-modules
        className
      )}
      {...props}
    />
  )
<<<<<<< HEAD
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
=======
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
>>>>>>> origin/feature/crm-core-modules
