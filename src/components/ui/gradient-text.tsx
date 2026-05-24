import * as React from "react";
import { cn } from "@/lib/utils";

export function GradientText({
  className,
  as: Tag = "span",
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const Component = Tag as React.ElementType;
  return (
    <Component className={cn("text-holo", className)} {...props} />
  );
}
