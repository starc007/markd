"use client";

import { Download } from "lucide-react";
import { ButtonLink, type ButtonSize } from "./button";

export function DownloadButton({
  label = "Download",
  size = "lg",
  className,
}: {
  label?: string;
  size?: ButtonSize;
  className?: string;
}) {
  return (
    <ButtonLink
      href="/download"
      size={size}
      className={className}
    >
      <Download className="size-[15px]" aria-hidden />
      {label}
    </ButtonLink>
  );
}
