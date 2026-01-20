import { BannerType } from "../components";

/**
 * Normalize banner type - converts old banner formats to "none"
 * Old formats: "gradient-{number}", "japanese-print-{string}"
 */
export function normalizeBannerType(bannerType: string | null | undefined): BannerType {
  if (!bannerType || bannerType === "none") {
    return "none";
  }
  
  // New formats
  if (bannerType.startsWith("static-") || bannerType.startsWith("custom-")) {
    return bannerType as BannerType;
  }
  
  // Old formats - convert to "none"
  if (bannerType.startsWith("gradient-") || bannerType.startsWith("japanese-print-")) {
    return "none";
  }
  
  // Unknown format - default to "none"
  return "none";
}