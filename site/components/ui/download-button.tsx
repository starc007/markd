"use client";

import { Download } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ButtonLink, type ButtonSize } from "./button";

export function DownloadButton({
  label = "Download",
  size = "lg",
  className,
  placement,
}: {
  label?: string;
  size?: ButtonSize;
  className?: string;
  placement: "nav" | "hero" | "footer";
}) {
  const track = useAnalytics();

  return (
    <ButtonLink
      href="/download"
      size={size}
      className={className}
      onClick={() => track("landing_download_clicked", { placement })}
    >
      <Download className="size-[15px]" aria-hidden />
      {label}
    </ButtonLink>
  );
}
