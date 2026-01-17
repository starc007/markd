// Japanese print images from assets folder
import image2 from "./2.jpg";
import image4 from "./4.jpg";
import image5 from "./5..jpg";
import image6 from "./6..jpg";
import image7 from "./7.jpg";
import image8 from "./8.jpg";
import image9 from "./9.jpg";
import image10 from "./10.jpg";

export const JAPANESE_PRINT_IMAGES = {
  "2": image2,
  "4": image4,
  "5": image5,
  "6": image6,
  "7": image7,
  "8": image8,
  "9": image9,
  "10": image10,
} as const;

// Array of first 5 images for banner selector
export const JAPANESE_PRINT_PREVIEWS = [
  { id: "2", url: image2 },
  { id: "4", url: image4 },
  { id: "5", url: image5 },
  { id: "6", url: image6 },
  { id: "7", url: image7 },
  { id: "8", url: image8 },
  { id: "9", url: image9 },
  { id: "10", url: image10 },
] as const;
