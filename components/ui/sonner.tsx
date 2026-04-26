"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-cream group-[.toaster]:text-ink group-[.toaster]:border-canela/15 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-ink/70",
          actionButton:
            "group-[.toast]:bg-canela group-[.toast]:text-cream",
          cancelButton:
            "group-[.toast]:bg-masa group-[.toast]:text-ink",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
