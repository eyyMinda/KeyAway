import type { Template } from "sanity";

/** Last minute of a calendar day in the editor's timezone, rolling to next year once it has passed. */
function nextEndOfDay(monthIndex: number, day: number): string {
  const now = new Date();
  const end = new Date(now.getFullYear(), monthIndex, day, 23, 59);
  if (end.getTime() < now.getTime()) end.setFullYear(end.getFullYear() + 1);
  return end.toISOString();
}

/** Studio "new document" presets. Each one prefills a `sitePromotion`; every field stays editable. */
export const promotionTemplates: Template[] = [
  {
    id: "sitePromotion-halloween",
    title: "🎃 Halloween giveaway",
    schemaType: "sitePromotion",
    value: () => ({
      title: `Halloween giveaway ${new Date().getFullYear()}`,
      enabled: true,
      startsAt: new Date().toISOString(),
      endsAt: nextEndOfDay(9, 31),
      theme: "halloween",
      ctaLabel: "Join to enter",
      mascot: {
        _type: "image",
        asset: { _type: "reference", _ref: "image-aa6ea2761c67580550678e473512a81519292be4-48x73-png" }
      },
      bannerMascot: {
        _type: "image",
        asset: { _type: "reference", _ref: "image-c613b6e5489e549985a85776f22cc55f8e38ccc4-73x123-png" }
      },
      bannerText: "1,000 members giveaway: 12 IObit Pro keys to win. Ends Halloween night!",
      cardTitle: "Halloween Giveaway",
      cardText: "We hit 1,000 members! Join our Facebook group and comment on the giveaway post to win an IObit Pro key.",
      cardProgramTitle: "Win {program} Pro",
      bellTitle: "Halloween Giveaway",
      bellText: "12 IObit Pro keys to win",
      popupText: "Halloween giveaway: enter now!",
      heroText: "Halloween giveaway: 12 Pro keys"
    })
  },
  {
    id: "sitePromotion-christmas",
    title: "🎄 Christmas giveaway",
    schemaType: "sitePromotion",
    value: () => ({
      title: `Christmas giveaway ${new Date().getFullYear()}`,
      enabled: true,
      endsAt: nextEndOfDay(11, 25),
      theme: "christmas",
      ctaLabel: "Join to enter",
      bannerText: "Christmas giveaway: free Pro keys to win. Ends Christmas Day!",
      cardTitle: "Christmas Giveaway",
      cardText: "Join our Facebook group and comment on the giveaway post for a chance to win a Pro key.",
      cardProgramTitle: "Win {program} Pro",
      bellTitle: "Christmas Giveaway",
      bellText: "Pro keys to win",
      popupText: "Christmas giveaway: enter now!",
      heroText: "Christmas giveaway: Pro keys to win"
    })
  },
  {
    id: "sitePromotion-black-friday",
    title: "🏷️ Black Friday sale",
    schemaType: "sitePromotion",
    value: () => ({
      title: `Black Friday sale ${new Date().getFullYear()}`,
      enabled: true,
      theme: "blackFriday",
      ctaLabel: "See the deals",
      bannerText: "Black Friday: big discounts on official Pro licenses.",
      cardTitle: "Black Friday Sale",
      cardText: "Prefer a full license? Official Pro versions are discounted for a limited time.",
      bellTitle: "Black Friday Sale",
      bellText: "Official Pro licenses on sale",
      popupText: "Black Friday deals are live!",
      heroText: "Black Friday: Pro licenses on sale"
    })
  }
];
