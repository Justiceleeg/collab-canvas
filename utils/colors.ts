// Color Parser Utility
// Converts color names to hex values for shape creation

const COLOR_MAP: Record<string, string> = {
  // Basic colors
  red: "#FF0000",
  blue: "#0000FF",
  green: "#00FF00",
  yellow: "#FFFF00",
  orange: "#FFA500",
  purple: "#800080",
  pink: "#FFC0CB",
  brown: "#A52A2A",
  black: "#000000",
  white: "#FFFFFF",
  gray: "#808080",
  grey: "#808080",

  // Light variants
  "light red": "#FF6B6B",
  "light blue": "#89CFF0",
  "light green": "#90EE90",
  "light yellow": "#FFFFE0",
  "light orange": "#FFD580",
  "light purple": "#DDA0DD",
  "light pink": "#FFB6C1",
  "light gray": "#D3D3D3",
  "light grey": "#D3D3D3",

  // Dark variants
  "dark red": "#8B0000",
  "dark blue": "#00008B",
  "dark green": "#006400",
  "dark yellow": "#9B870C",
  "dark orange": "#FF8C00",
  "dark purple": "#4B0082",
  "dark pink": "#FF1493",
  "dark gray": "#A9A9A9",
  "dark grey": "#A9A9A9",
};

/**
 * Parse a color name or hex value into a hex color string
 * @param colorInput - Color name (e.g., "red", "dark blue") or hex value (e.g., "#FF0000")
 * @returns Hex color string
 */
export function parseColor(colorInput: string): string {
  // If already in hex format, return as-is
  if (colorInput.startsWith("#")) {
    return colorInput;
  }

  // Normalize input (lowercase, trim)
  const normalized = colorInput.toLowerCase().trim();

  // Look up in color map
  const hexColor = COLOR_MAP[normalized];

  // Return mapped color or default to input (in case it's a valid CSS color)
  return hexColor || `#${normalized}`;
}

/**
 * Check if a string is a valid color input
 */
export function isValidColor(colorInput: string): boolean {
  if (colorInput.startsWith("#")) {
    // Check if valid hex format
    return /^#[0-9A-Fa-f]{6}$/.test(colorInput);
  }

  // Check if it's in our color map
  const normalized = colorInput.toLowerCase().trim();
  return normalized in COLOR_MAP;
}
