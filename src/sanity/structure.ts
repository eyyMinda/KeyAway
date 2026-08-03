import type { StructureBuilder, StructureResolver } from "sanity/structure";

/** Nested folder of document type lists (uses schema titles unless overridden). */
function docGroup(S: StructureBuilder, title: string, types: string[]) {
  return S.listItem()
    .title(title)
    .id(`group-${title.toLowerCase().replace(/\s+/g, "-")}`)
    .child(
      S.list()
        .title(title)
        .items(types.map(type => S.documentTypeListItem(type).id(type)))
    );
}

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = S =>
  S.list()
    .title("Content")
    .items([
      // —— Top (pinned) ——
      S.listItem()
        .title("Visitors")
        .id("visitor-desk")
        .child(S.documentTypeList("visitor").title("Visitors")),

      S.divider(),

      // —— Content groups ——
      docGroup(S, "Programs", [
        "program",
        "programCategory",
        "vendor",
        "featuredProgramSettings"
      ]),

      docGroup(S, "Store", ["storeDetails"]),

      docGroup(S, "Community", ["contactMessage", "keySuggestion", "keyReport"]),

      docGroup(S, "Analytics", ["trackingEvent", "trackingEventBundle", "visitorBundle"]),

      docGroup(S, "System", ["siteNotificationFeed", "cronRun"]),

      S.divider(),

      // —— Bottom (pinned) ——
      S.listItem()
        .title("Changelog")
        .id("changelog-desk")
        .child(
          S.documentTypeList("changelogRelease")
            .title("Changelog")
            .defaultOrdering([{ field: "releasedAt", direction: "desc" }])
        )
    ]);
