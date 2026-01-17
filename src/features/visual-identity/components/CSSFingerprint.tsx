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
  // Fixed gradient colors - 6 predefined gradients, each is a mix of 2 colors
  const fixedGradients = [
    { colors: ["#84d2cc", "#914db3"] }, // Teal to Purple
    { colors: ["#a8e6cf", "#dcedc1"] }, // Mint to Light Green
    { colors: ["#ffd3b6", "#ffaaa5"] }, // Peach to Coral
    { colors: ["#c7ceea", "#b4a7d6"] }, // Lavender to Purple
    { colors: ["#ffeaa7", "#fdcb6e"] }, // Yellow to Orange
    { colors: ["#dfe6e9", "#b2bec3"] }, // Light Grey to Grey
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
