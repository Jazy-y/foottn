"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!bg-card/80 !backdrop-blur-xl !border-white/[0.06] !text-foreground !rounded-xl",
          title: "!font-mono !tracking-tight",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
