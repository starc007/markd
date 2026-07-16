"use client";

import { Apple } from "lucide-react";
import { track } from "@/lib/analytics";
import { VERSION } from "@/lib/config";
import { ButtonLink } from "@/components/ui/button";
import { LinuxIcon } from "./PlatformIcons";

type DownloadLinkProps = {
  href: string;
  label: string;
  platform: "macos" | "linux";
  format: "dmg" | "appimage" | "deb";
  primary?: boolean;
};

export function DownloadLink({
  href,
  label,
  platform,
  format,
  primary = false,
}: DownloadLinkProps) {
  const PlatformIcon = platform === "macos" ? Apple : LinuxIcon;

  return (
    <ButtonLink
      href={href}
      size="md"
      variant={primary ? "primary" : "outline"}
      className="w-full sm:w-auto"
      onClick={() => track("Download", { version: VERSION, platform, format })}
    >
      <PlatformIcon className="size-4" strokeWidth={1.8} aria-hidden />
      {label}
    </ButtonLink>
  );
}
