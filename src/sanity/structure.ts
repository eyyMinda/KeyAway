import type { StructureResolver } from "sanity/structure";

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = S =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Visitors")
        .id("visitor-desk")
        .child(S.documentTypeList("visitor").title("Visitors")),
      S.divider(),
      ...S.documentTypeListItems().filter(item => item.getId() !== "visitor")
    ]);
