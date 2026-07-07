/** Shape stored by `@sanity/color-input` on vendor.logoBackgroundColor. */
export type VendorLogoBackgroundColor = {
  _type?: "color";
  hex?: string;
  alpha?: number;
  rgb?: { r: number; g: number; b: number; a?: number };
};

/** CSS color for vendor logo tile background; undefined = transparent. */
export function resolveVendorLogoBackgroundColor(
  color?: VendorLogoBackgroundColor | null
): string | undefined {
  if (!color) return undefined;

  if (color.hex) {
    const alpha = color.alpha ?? color.rgb?.a;
    if (typeof alpha === "number" && alpha < 1 && color.rgb) {
      const { r, g, b } = color.rgb;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color.hex;
  }

  if (color.rgb) {
    const { r, g, b, a = 1 } = color.rgb;
    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
  }

  return undefined;
}
