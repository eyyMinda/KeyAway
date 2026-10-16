import type { StructureBuilder, StructureResolver } from "sanity/structure";
import { GIVEAWAY_DISCOVERY_SETTINGS_ID, GIVEAWAY_IGNORED_ITEMS_ID } from "@/src/lib/giveaways/constants";

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
      // —— Content groups ——
      docGroup(S, "Programs", [
        "program",
        "programCategory",
        "vendor",
        "featuredProgramSettings"
      ]),

      docGroup(S, "Store", ["storeDetails"]),

      docGroup(S, "Community", ["contactMessage", "keySuggestion"]),

      // Private: settings and finds use dotted ids, so the public dataset API never returns them.
      S.listItem()
        .title("Giveaway Discovery")
        .id("group-giveaway-discovery")
        .child(
          S.list()
            .title("Giveaway Discovery")
            .items([
              S.listItem()
                .title("Settings (private)")
                .id("giveawayDiscoverySettings")
                .child(
                  S.document()
                    .schemaType("giveawayDiscoverySettings")
                    .documentId(GIVEAWAY_DISCOVERY_SETTINGS_ID)
                    .title("Giveaway Discovery Settings")
                ),
              S.listItem()
                .title("Ignored keys (private)")
                .id("giveawayIgnoredItems")
                .child(
                  S.document()
                    .schemaType("giveawayIgnoredItems")
                    .documentId(GIVEAWAY_IGNORED_ITEMS_ID)
                    .title("Ignored Giveaway Keys")
                ),
              S.documentTypeListItem("giveawayFind").id("giveawayFind")
            ])
        ),

      docGroup(S, "System", ["siteNotificationFeed", "siteNotificationBundle", "cronRun"]),

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
