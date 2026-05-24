import * as React from "react";
import { cn } from "@/lib/utils";

export function HairlineBorder({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("hairline rounded-xl", className)} {...props}>
      {children}
    </div>
  );
}
