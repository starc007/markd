/**
 * CSS-based fingerprint component - no canvas, no Base64 storage
 * Generates beautiful patterns using pure CSS
 */

interface CSSFingerprintProps {
  width: number;
  height: number;
  variant?: "thumbnail" | "banner" | "indicator";
  className?: string;
  style?: React.CSSProperties;
}

export function CSSFingerprint({
  width,
  height,
  variant = "thumbnail",
  className = "",
  style,
  gradientIndex = 0,
}: CSSFingerprintProps & { gradientIndex?: number }) {
  // Fixed gradient colors - 6 predefined gradients
  // Warm, greenish, and blueish tones - soft and subtle
  const fixedGradients = [
    { colors: ["#a8d5ba", "#7fb3a3"] }, // Warm green to teal
    { colors: ["#b8e0d2", "#6bb5a0"] }, // Mint green to blue-green
    { colors: ["#c4e8d8", "#8bc4b0"] }, // Light green to sage
    { colors: ["#a3d9d1", "#7ab8c4"] }, // Teal to blue
    { colors: ["#b5d4e3", "#8fb8d1"] }, // Sky blue to soft blue
    { colors: ["#c8e0e8", "#a0c4d4"] }, // Light blue to periwinkle
  ];

  const gradient = fixedGradients[gradientIndex % fixedGradients.length];
  const color1 = gradient.colors[0];
  const color2 = gradient.colors[1];

  // Generate simple radial gradient pattern with fixed colors
  const centerX = 40 + ((gradientIndex * 5) % 30); // 40-70%
  const centerY = 40 + ((gradientIndex * 7) % 30); // 40-70%
  const blurAmount = 20 + ((gradientIndex * 3) % 15); // 20-35px

  const gradientCSS = `radial-gradient(circle at ${centerX}% ${centerY}%, ${color1} 0%, ${color2} 50%, rgba(250, 250, 250, 0.98) 100%)`;

  const patternData = {
    gradientColors: gradient.colors,
    patternType: "radial-gradient",
    cssStyles: {
      background: gradientCSS,
      filter: `blur(${blurAmount}px)`,
    },
    cssClasses: "pattern-radial-gradient",
    patternParams: {
      width,
      height,
    },
  };

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius:
      variant === "thumbnail" || variant === "indicator" ? "50%" : 0,
    overflow: "hidden",
    position: "relative",
    ...patternData.cssStyles,
    ...style,
  };

  return (
    <div
      className={`${className} ${patternData.cssClasses}`}
      style={containerStyle}
    />
  );
}
