export type PromotionTheme = {
  title: string;
  emoji: string;
  /** Border, background and text for the banner, program card and hero badge. */
  surface: string;
  button: string;
  /** Left edge of the pinned bell row. */
  bellEdge: string;
};

export const PROMOTION_THEMES = {
  community: {
    title: "Community",
    emoji: "🎉",
    surface: "border-[#2f6da3] bg-[linear-gradient(90deg,#12304d,#1a3a5c)] text-[#d6e6f2]",
    button: "bg-[#2f6da3] text-white hover:bg-[#3a82c0]",
    bellEdge: "border-l-[#66c0f4]"
  },
  halloween: {
    title: "Halloween",
    emoji: "🎃",
    surface: "border-[#a8551c] bg-[linear-gradient(90deg,#3a1c08,#2a1436,#3a1c08)] text-[#ffe1c4]",
    button: "bg-[#d9701f] text-[#1b0d03] hover:bg-[#f0872f]",
    bellEdge: "border-l-[#d9701f]"
  },
  christmas: {
    title: "Christmas",
    emoji: "🎄",
    surface: "border-[#2f7a48] bg-[linear-gradient(90deg,#102e1c,#3a1216,#102e1c)] text-[#e6f2e8]",
    button: "bg-[#2f7a48] text-white hover:bg-[#3a9459]",
    bellEdge: "border-l-[#3a9459]"
  },
  blackFriday: {
    title: "Black Friday",
    emoji: "🏷️",
    surface: "border-[#b8962e] bg-[linear-gradient(90deg,#0b0b0b,#231d0a)] text-[#f5e7b8]",
    button: "bg-[#d4af37] text-[#1a1404] hover:bg-[#e8c655]",
    bellEdge: "border-l-[#d4af37]"
  }
} as const satisfies Record<string, PromotionTheme>;

export type PromotionThemeId = keyof typeof PROMOTION_THEMES;

export function getPromotionTheme(id?: PromotionThemeId): PromotionTheme {
  return PROMOTION_THEMES[id ?? "community"] ?? PROMOTION_THEMES.community;
}
