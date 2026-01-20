import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownSeparator,
  Button,
} from "../ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageIcon, UploadIcon } from "@hugeicons/core-free-icons";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { saveBannerImage } from "@/lib/tauri/commands";
import { useState } from "react";

// Static banner image URLs - add your image URLs here
const STATIC_BANNER_IMAGES = [
  // Add your static image URLs here
  // Example: "https://example.com/image1.jpg",
  // Example: "https://example.com/image2.jpg",
] as const;

export type BannerType =
  | "none"
  | `static-${string}`
  | `custom-${string}`;

interface BannerSelectorProps {
  currentBanner?: BannerType;
  onSelect: (type: BannerType) => void;
  noteId: string;
}

export function BannerSelector({
  onSelect,
  currentBanner,
  noteId,
}: BannerSelectorProps) {
  const isNone = currentBanner === "none";
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async () => {
    try {
      setIsUploading(true);
      const file = await open({
        multiple: false,
        filters: [
          {
            name: "Images",
            extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg"],
          },
        ],
      });

      if (!file) {
        setIsUploading(false);
        return;
      }

      // Get file path (handle both string and FileWithPath types)
      const filePath = typeof file === "string" ? file : file.path;
      
      // Read file as binary (readFile returns Uint8Array in Tauri v2)
      const fileData = await readFile(filePath);
      
      // Convert to base64 (handle large files by chunking)
      const bytes = new Uint8Array(fileData);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        // Use Array.from to avoid "Maximum call stack size exceeded" for large arrays
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);
      
      // Determine MIME type from file extension
      const extension = filePath.split('.').pop()?.toLowerCase() || 'png';
      const mimeTypes: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
      };
      const mimeType = mimeTypes[extension] || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      // Save to database
      await saveBannerImage(noteId, dataUrl);
      
      // Generate a unique ID for this custom image
      const imageId = crypto.randomUUID();
      onSelect(`custom-${imageId}` as BannerType);
      
      toast.success("Banner image uploaded successfully");
    } catch (error) {
      console.error("Failed to upload banner image:", error);
      toast.error("Failed to upload banner image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <button className="px-3 py-1.5 text-sm text-foreground  rounded-md bg-accent transition-colors flex items-center gap-2">
          <HugeiconsIcon icon={ImageIcon} size={16} />
          <span>{!isNone ? "Update Banner" : "Add Banner"}</span>
        </button>
      </DropdownTrigger>
      <DropdownContent align="start" className="w-[500px] p-4">
        {/* No Banner Option */}
        <div className="flex justify-end">
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => onSelect("none")}
          >
            Remove Banner
          </Button>
        </div>

        <DropdownSeparator className="my-4" />

        {/* Custom Image Upload */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-3">Upload Image</h3>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleFileSelect}
            disabled={isUploading}
          >
            <HugeiconsIcon icon={UploadIcon} size={16} />
            <span>{isUploading ? "Uploading..." : "Select from Computer"}</span>
          </Button>
        </div>

        <DropdownSeparator className="my-4" />

        {/* Static Images */}
        {STATIC_BANNER_IMAGES.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Static Images</h3>
            <div className="grid grid-cols-5 gap-3">
              {STATIC_BANNER_IMAGES.map((url, index) => (
                <div
                  key={index}
                  className="cursor-pointer group"
                  onClick={() => onSelect(`static-${url}` as BannerType)}
                >
                  <div className="w-full aspect-5/3 rounded-lg overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                    <img
                      src={url}
                      alt={`Banner ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DropdownContent>
    </Dropdown>
  );
}
