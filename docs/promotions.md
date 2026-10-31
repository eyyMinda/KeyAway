# Promotions

Temporary campaigns (giveaways, sales) are `sitePromotion` documents, managed under **Promotions** in the Studio.

## Run a campaign

1. Open **Promotions** and create one from a preset: Halloween giveaway, Christmas giveaway or Black Friday sale. For a repeat, you can also duplicate last year's document.
2. Check the dates and copy, then publish.

Changes in the document appear after the revalidation webhook runs. If it doesn't run, they can take up to 12 hours.

## Where it shows

| Field | Placement | When blank |
| --- | --- | --- |
| Banner text | Strip under the header on every public page | No banner |
| Card text (title, per-program title) | Replaces the Facebook card on program pages | Normal Facebook card |
| Pinned row title (and text) | Top of the bell dropdown, counted in the badge | No pinned row |
| Popup text | Bell mini popup | "New updates available!" |
| Badge on the hero image | Homepage hero image | No badge |

The button goes to **Button link**, or to the Facebook group in Store Details when that is blank. **Mascot** is an optional image that floats by the button on the banner and program card. **Banner mascot** replaces it on the banner only.

## Ending early

Everything disappears at **Ends**, with no redeploy. To stop sooner, turn off **Enabled** and publish.

## Analytics

Clicks show in the **Promotions** section of `/admin/analytics`, under Activity. They are stored as `social_click` with `social` set to `promo-banner`, `promo-program`, `promo-bell` or `promo-home`, and `label` set to the promotion's id. A click counts as a success: conversion is the visitors who clicked, out of everyone active on the site during the campaign.

## Add a theme or preset

- Themes: `src/lib/promotions/promotionThemes.ts`
- Presets: `src/sanity/promotionTemplates.ts`
